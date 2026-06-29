param(
  [string]$SiteUrl = "https://www.xiayuwu.top",
  [string]$Destination = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$postsDir = Join-Path $Destination "_posts"
$imageDir = Join-Path $Destination "assets\images\imported"
New-Item -ItemType Directory -Force $postsDir, $imageDir | Out-Null

function Slugify([string]$value) {
  $decoded = [System.Net.WebUtility]::HtmlDecode($value).ToLowerInvariant()
  $slug = [regex]::Replace($decoded, "[^a-z0-9\u4e00-\u9fff]+", "-").Trim("-")
  if ([string]::IsNullOrWhiteSpace($slug)) { return [guid]::NewGuid().ToString("N").Substring(0, 8) }
  return $slug
}

function EscapeYaml([string]$value) {
  return '"' + ($value -replace '\\', '\\' -replace '"', '\"' -replace "`r?`n", ' ') + '"'
}

$page = 1
$allPosts = @()
do {
  $uri = "$($SiteUrl.TrimEnd('/'))/wp-json/wp/v2/posts?status=publish&per_page=100&page=$page&_embed=1"
  Write-Host "读取第 $page 页：$uri"
  try { $batch = Invoke-RestMethod -Uri $uri -UseBasicParsing }
  catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) { break }
    throw
  }
  $allPosts += @($batch)
  $page++
} while (@($batch).Count -eq 100)

foreach ($post in $allPosts) {
  $date = [datetime]$post.date
  $slug = if ($post.slug) { Slugify $post.slug } else { Slugify $post.title.rendered }
  $filename = "{0}-{1}.md" -f $date.ToString("yyyy-MM-dd"), $slug
  $body = [System.Net.WebUtility]::HtmlDecode([string]$post.content.rendered)

  $matches = [regex]::Matches($body, '(?i)(?:src|href)=["''](https?://[^"'']+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^"'']*)?)["'']')
  foreach ($match in $matches) {
    $remote = $match.Groups[1].Value
    try {
      $ext = [IO.Path]::GetExtension(([uri]$remote).AbsolutePath)
      $localName = "{0}-{1}{2}" -f $date.ToString("yyyyMMdd"), ([guid]::NewGuid().ToString("N").Substring(0,8)), $ext
      $localPath = Join-Path $imageDir $localName
      Invoke-WebRequest -Uri $remote -OutFile $localPath -UseBasicParsing
      $body = $body.Replace($remote, "/assets/images/imported/$localName")
    } catch { Write-Warning "图片下载失败：$remote" }
  }

  $title = [System.Net.WebUtility]::HtmlDecode([string]$post.title.rendered)
  $frontMatter = @(
    "---"
    "layout: post"
    "title: $(EscapeYaml $title)"
    "date: $($date.ToString('yyyy-MM-dd HH:mm:ss')) +0800"
    "wordpress_id: $($post.id)"
    "original_url: $(EscapeYaml ([string]$post.link))"
    "---"
    ""
  ) -join "`n"
  [IO.File]::WriteAllText((Join-Path $postsDir $filename), $frontMatter + $body, [Text.UTF8Encoding]::new($false))
  Write-Host "已迁移：$title"
}

Write-Host "完成，共迁移 $($allPosts.Count) 篇文章。"

