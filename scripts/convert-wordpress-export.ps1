param(
  [Parameter(Mandatory = $true)][string]$JsonPath,
  [Parameter(Mandatory = $true)][string]$Destination
)

$ErrorActionPreference = "Stop"
$postsDir = Join-Path $Destination "_posts"
$imageDir = Join-Path $Destination "assets\images\imported"
New-Item -ItemType Directory -Force $postsDir, $imageDir | Out-Null

function YamlQuote([string]$value) {
  if ($null -eq $value) { return '""' }
  return '"' + ($value -replace '\\', '\\' -replace '"', '\"' -replace "`r?`n", ' ') + '"'
}

function PlainText([string]$html) {
  $text = [regex]::Replace($html, '<[^>]+>', ' ')
  $text = [System.Net.WebUtility]::HtmlDecode($text)
  return ([regex]::Replace($text, '\s+', ' ')).Trim()
}

function SafeSlug([string]$value, [int]$id) {
  $decoded = [System.Net.WebUtility]::UrlDecode($value).ToLowerInvariant()
  $slug = [regex]::Replace($decoded, '[^a-z0-9\u4e00-\u9fff]+', '-').Trim('-')
  if ([string]::IsNullOrWhiteSpace($slug)) { return "post-$id" }
  return $slug
}

function ImageName([string]$url, [int]$postId) {
  $uri = [uri]$url
  $base = [IO.Path]::GetFileName($uri.AbsolutePath)
  $base = [System.Net.WebUtility]::UrlDecode($base)
  $base = [regex]::Replace($base, '[^a-zA-Z0-9._-]', '-')
  if ([string]::IsNullOrWhiteSpace($base)) { $base = "image.jpg" }
  return "$postId-$base"
}

$posts = Get-Content -Raw -Encoding UTF8 $JsonPath | ConvertFrom-Json
$migrated = 0
$downloaded = 0

foreach ($post in $posts) {
  $id = [int]$post.id
  $date = [datetime]$post.date
  $title = [System.Net.WebUtility]::HtmlDecode([string]$post.title.rendered)
  $slug = SafeSlug ([string]$post.slug) $id
  $body = [System.Net.WebUtility]::HtmlDecode([string]$post.content.rendered)
  $description = PlainText ([string]$post.excerpt.rendered)
  if ($description.Length -gt 150) { $description = $description.Substring(0, 150).Trim() + '...' }

  $category = "Uncategorized"
  try {
    $termProperty = $post._embedded.PSObject.Properties["wp:term"]
    $terms = @($termProperty.Value)[0]
    if ($terms -and $terms.Count -gt 0) { $category = [string]$terms[0].name }
  } catch {}

  $urls = New-Object System.Collections.Generic.HashSet[string]
  foreach ($match in [regex]::Matches($body, '(?i)https?://[^\s"''<>]+?\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s"''<>]*)?')) {
    [void]$urls.Add($match.Value)
  }
  if ($post.jetpack_featured_media_url) { [void]$urls.Add([string]$post.jetpack_featured_media_url) }

  $featuredLocal = ""
  foreach ($remote in $urls) {
    $cleanRemote = $remote -replace '&amp;', '&'
    $name = ImageName $cleanRemote $id
    $localPath = Join-Path $imageDir $name
    if (-not (Test-Path $localPath)) {
      & curl.exe -k -L --connect-timeout 8 --max-time 90 -sS $cleanRemote -o $localPath
      if ($LASTEXITCODE -eq 0) { $downloaded++ } else { Write-Warning "Image failed: $cleanRemote"; continue }
    }
    $sitePath = "/assets/images/imported/$name"
    $body = $body.Replace($remote, $sitePath).Replace($cleanRemote, $sitePath)
    if ($post.jetpack_featured_media_url -eq $remote) { $featuredLocal = $sitePath }
  }

  $body = $body -replace '<p>\s*<!--\s*\/?wp:[\s\S]*?-->\s*</p>', ''
  $body = $body -replace 'http://www\.xiayuwu\.top', 'https://www.xiayuwu.top'
  $filename = "{0}-{1}.md" -f $date.ToString('yyyy-MM-dd'), $slug
  $lines = @(
    '---'
    'layout: post'
    "title: $(YamlQuote $title)"
    "description: $(YamlQuote $description)"
    "date: $($date.ToString('yyyy-MM-dd HH:mm:ss')) +0800"
    "categories: [$(YamlQuote $category)]"
    "wordpress_id: $id"
    "original_url: $(YamlQuote ([string]$post.link))"
    "permalink: /index.php/archives/$id/"
  )
  if ($featuredLocal) { $lines += "image: $(YamlQuote $featuredLocal)" }
  $lines += @('---', '', $body)
  [IO.File]::WriteAllText((Join-Path $postsDir $filename), ($lines -join "`n"), [Text.UTF8Encoding]::new($false))
  $migrated++
  Write-Host "[$migrated/$($posts.Count)] $title"
}

Write-Host "Migration complete: $migrated posts, $downloaded images."
