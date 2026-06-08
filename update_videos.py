import urllib.request
import xml.etree.ElementTree as ET
import json
import re

CHANNEL_HANDLE = "@GeoeconomicStrategyUnit"
VIDEO_COUNT = 3


def get_channel_id(handle):
    url = f"https://www.youtube.com/{handle}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    })
    html = urllib.request.urlopen(req).read().decode("utf-8")
    match = re.search(r'"channelId":"(UC[a-zA-Z0-9_-]+)"', html)
    if match:
        return match.group(1)
    match = re.search(r'href="/channel/(UC[a-zA-Z0-9_-]+)"', html)
    if match:
        return match.group(1)
    raise ValueError(f"Could not find channel ID for {handle}")


def get_latest_videos(channel_id, count=VIDEO_COUNT):
    rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    rss_content = urllib.request.urlopen(rss_url).read()

    root = ET.fromstring(rss_content)
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/",
    }

    videos = []
    for entry in root.findall("atom:entry", ns)[:count]:
        video_id = entry.find("yt:videoId", ns).text
        title = entry.find("atom:title", ns).text
        published = entry.find("atom:published", ns).text
        videos.append({"id": video_id, "title": title, "published": published})

    return videos


if __name__ == "__main__":
    channel_id = get_channel_id(CHANNEL_HANDLE)
    print(f"Channel ID: {channel_id}")
    videos = get_latest_videos(channel_id)
    print(f"Found {len(videos)} videos:")
    for v in videos:
        print(f"  - {v['title']} ({v['id']})")
    with open("videos.json", "w") as f:
        json.dump(videos, f, indent=2)
    print("Updated videos.json")
