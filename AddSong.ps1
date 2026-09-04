# AddSong.ps1 - PowerShell script to download audio using yt-dlp, fetch synced lyrics from LRCLIB, and register song in DB
param(
    [string]$YouTubeInput,
    [string]$Language,
    [string]$Title,
    [string]$Artist,
    [string]$Year
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "          RoBotica - Add Song & Stream Audio              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Resolve YouTube ID or URL
if (-not $YouTubeInput) {
    $YouTubeInput = Read-Host "Enter YouTube Video ID or URL"
}

if (-not $YouTubeInput) {
    Write-Error "YouTube Video ID or URL is required."
    exit 1
}

$YouTubeId = $YouTubeInput
if ($YouTubeInput -match "(?:v=|youtu\.be/|embed/|/v/|/e/|watch\?v=|&v=)([a-zA-Z0-9_-]{11})") {
    $YouTubeId = $Matches[1]
} elseif ($YouTubeInput -match "([a-zA-Z0-9_-]{11})") {
    $YouTubeId = $Matches[1]
}

Write-Host "YouTube ID: $YouTubeId" -ForegroundColor Green

# 2. Select Language
if (-not $Language) {
    Write-Host "`nSelect language for this song:"
    Write-Host "1) Romanian`n2) Spanish`n3) French`n4) Italian`n5) Portuguese`n6) German"
    $choice = Read-Host "Enter number (1-6) or type name [default: Spanish]"
    switch ($choice) {
        "1" { $Language = "Romanian" }
        "2" { $Language = "Spanish" }
        "3" { $Language = "French" }
        "4" { $Language = "Italian" }
        "5" { $Language = "Portuguese" }
        "6" { $Language = "German" }
        default {
            if ($choice -in @("Romanian", "Spanish", "French", "Italian", "Portuguese", "German")) {
                $Language = $choice
            } else {
                $Language = "Spanish"
            }
        }
    }
}

Write-Host "Language: $Language" -ForegroundColor Green

# 3. Create directories
if (-not (Test-Path "server/music")) { New-Item -ItemType Directory -Path "server/music" -Force | Out-Null }
if (-not (Test-Path "music")) { New-Item -ItemType Directory -Path "music" -Force | Out-Null }

# 4. Extract metadata if needed
Write-Host "`nExtracting YouTube metadata..." -ForegroundColor Yellow
$metadataRaw = python -m yt_dlp --dump-json --skip-download "https://www.youtube.com/watch?v=$YouTubeId" 2>$null
$meta = $null
if ($metadataRaw) {
    try { $meta = $metadataRaw | ConvertFrom-Json } catch {}
}

if (-not $Title) {
    $autoTitle = if ($meta) { if ($meta.track) { $meta.track } else { $meta.title } } else { "" }
    if ($autoTitle) {
        $userTitle = Read-Host "Song Title [$autoTitle]"
        $Title = if ($userTitle) { $userTitle } else { $autoTitle }
    } else {
        $Title = Read-Host "Enter Song Title"
    }
}

if (-not $Artist) {
    $autoArtist = if ($meta) { if ($meta.artist) { $meta.artist } elseif ($meta.uploader) { $meta.uploader } else { $meta.channel } } else { "" }
    if ($autoArtist) {
        $userArtist = Read-Host "Song Artist [$autoArtist]"
        $Artist = if ($userArtist) { $userArtist } else { $autoArtist }
    } else {
        $Artist = Read-Host "Enter Song Artist"
    }
}

if (-not $Year) {
    $autoYear = if ($meta) { if ($meta.release_year) { $meta.release_year } elseif ($meta.upload_date) { $meta.upload_date.Substring(0,4) } else { "" } } else { "" }
    if ($autoYear) {
        $userYear = Read-Host "Release Year [$autoYear]"
        $Year = if ($userYear) { $userYear } else { $autoYear }
    } else {
        $Year = Read-Host "Release Year (optional, press Enter to skip)"
    }
}

# 5. Download Audio Stream
Write-Host "`nDownloading audio stream using yt-dlp..." -ForegroundColor Yellow
python -m yt_dlp -x --audio-format mp3 --audio-quality 192K --no-playlist -o "server/music/${YouTubeId}.%(ext)s" "https://www.youtube.com/watch?v=$YouTubeId"

if (Test-Path "server/music/${YouTubeId}.mp3") {
    Copy-Item "server/music/${YouTubeId}.mp3" "music/${YouTubeId}.mp3" -Force
    Write-Host "Audio file successfully saved to server/music/${YouTubeId}.mp3" -ForegroundColor Green
} else {
    Write-Warning "Audio file server/music/${YouTubeId}.mp3 was not created."
}

# 6. Fetch LRCLIB Synced Lyrics
Write-Host "`nFetching synchronized lyrics from LRCLIB for '$Title' by '$Artist'..." -ForegroundColor Yellow
$lyricsType = "none"
$lyricsContent = ""

try {
    $exactUri = "https://lrclib.net/api/get?track_name=" + [System.Uri]::EscapeDataString($Title) + "&artist_name=" + [System.Uri]::EscapeDataString($Artist)
    $exactResp = Invoke-RestMethod -Uri $exactUri -Headers @{ "User-Agent" = "RoBotica/1.0" } -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($exactResp -and $exactResp.syncedLyrics) {
        $lyricsType = "synced"
        $lyricsContent = $exactResp.syncedLyrics
    }
} catch {}

if ($lyricsType -eq "none") {
    try {
        $searchUri = "https://lrclib.net/api/search?q=" + [System.Uri]::EscapeDataString("$Title $Artist")
        $searchResp = Invoke-RestMethod -Uri $searchUri -Headers @{ "User-Agent" = "RoBotica/1.0" } -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($searchResp -and $searchResp.Count -gt 0) {
            $match = $searchResp | Where-Object { $_.syncedLyrics } | Select-Object -First 1
            if ($match) {
                $lyricsType = "synced"
                $lyricsContent = $match.syncedLyrics
            } elseif ($searchResp[0].plainLyrics) {
                $lyricsType = "plain"
                $lyricsContent = $searchResp[0].plainLyrics
            }
        }
    } catch {}
}

if ($lyricsType -eq "synced") {
    Write-Host "Found time-synced lyrics (LRC format) on LRCLIB!" -ForegroundColor Green
} elseif ($lyricsType -eq "plain") {
    Write-Host "Found plain lyrics on LRCLIB (no sync timestamps)." -ForegroundColor Yellow
} else {
    Write-Host "No lyrics found automatically on LRCLIB." -ForegroundColor Gray
}

# 7. Add to DB
Write-Host "`nAdding song to database..." -ForegroundColor Yellow

$payloadObj = @{
    language = $Language
    title = $Title
    artist = $Artist
    year = if ($Year) { [int]$Year } else { $null }
    lyrics = $lyricsContent
    thumbnail_url = "https://i.ytimg.com/vi/${YouTubeId}/hqdefault.jpg"
    image_url = "https://i.ytimg.com/vi/${YouTubeId}/maxresdefault.jpg"
    youtube_video_id = $YouTubeId
}

$payloadJson = $payloadObj | ConvertTo-Json -Compress
node scripts/add_song_db.js $payloadJson

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " [Done] Song '$Title' by '$Artist' is ready!" -ForegroundColor Green
Write-Host " Audio: server/music/${YouTubeId}.mp3"
Write-Host " Stream: /api/stream/${YouTubeId}"
Write-Host " Lyrics: $lyricsType"
Write-Host "==========================================================" -ForegroundColor Cyan
