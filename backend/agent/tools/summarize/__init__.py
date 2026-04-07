"""
SUMMARIZE TOOLS
═════════════════════════════════════
Tools for fetching cloud materials, summarizing, searching TikTok, and downloading TikTok videos.
"""
import os
import json
import time
import yt_dlp
import uuid
from typing import List, Dict, Any
from langchain_core.tools import tool
from apify_client import ApifyClient
from dotenv import load_dotenv

load_dotenv()

# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 1 — Fetch Material From Cloud
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def summarize_fetch_material_from_cloud(subject: str, topic: str) -> str:
    """Simulate fetching raw classroom materials (teacher slides, assignments) from a cloud folder.
    
    Args:
        subject: The subject of the class (e.g. Science).
        topic: The topic of the material (e.g. Photosynthesis).
    """
    return f"""[RAW CLOUD MATERIAL: {subject} - {topic}]
Today's class focuses on {topic}. This is a crucial concept.
Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy.
Key Process: They take in carbon dioxide (CO2) from the air and water (H2O) from the soil. Using the energy from sunlight, they convert these ingredients into glucose (a type of sugar) to use for food, and oxygen (O2) which they release into the air.
Important term 1: Chlorophyll - The green pigment found in the chloroplasts of higher plants and in cells of photosynthetic microorganisms, which is primarily involved in absorbing light energy for photosynthesis.
Important term 2: Stomata - Tiny openings or pores in plant tissue that allow for gas exchange.
Real-world application: Understanding photosynthesis is essential for agriculture, allowing us to improve crop yields and develop sustainable farming practices. It is also the reason we have oxygen to breathe!
"""

# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 2 — TikTok Search (Apify)
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def summarize_search_tiktok(query: str) -> List[Dict[str, Any]]:
    """Search for TikTok videos based on visual keywords using Apify.
    
    Args:
        query: The search query to look for on TikTok.
    """
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        print("Warning: APIFY_API_TOKEN is missing. Returning mock data.")
        return [
            {
                "id": f"mock_{uuid.uuid4().hex[:6]}", 
                "desc": f"Mock video for {query}", 
                "videoUrl": "https://mock.tiktok/123", 
                "author": "mock_educator", 
                "stats": {"likes": 1000, "views": 5000}
            }
        ]
        
    client = ApifyClient(token)
    run_input = {
        "searchQueries": [query],
        "resultsPerPage": 3,
        "searchSection": "/video",
        "shouldDownloadCovers": False,
        "shouldDownloadSlideshowImages": False,
        "shouldDownloadVideos": False
    }
    
    try:
        run = client.actor("clockworks/tiktok-scraper").call(run_input=run_input)
        
        items = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            video_url = ""
            if "videoMeta" in item and item["videoMeta"]:
                video_url = item["videoMeta"].get("downloadAddr", "")
            if not video_url:
                video_url = item.get("webVideoUrl", "")
                
            author_meta = item.get("authorMeta") or {}
            
            items.append({
                "id": str(item.get("id", "")),
                "desc": item.get("text", ""),
                "videoUrl": video_url,
                "author": author_meta.get("name", ""),
                "stats": {
                    "likes": item.get("diggCount", 0),
                    "views": item.get("playCount", 0)
                }
            })
        return items
    except Exception as e:
        print(f"Apify Error: {e}")
        return []

# ═══════════════════════════════════════════════════════════════════════════════
# TOOL 3 — TikTok Download (yt-dlp)
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def summarize_download_tiktok(videoUrl: str) -> str:
    """Download the TikTok MP4 file for safe offline viewing on the dashboard.
    
    Args:
        videoUrl: The URL of the TikTok video to download.
    """
    if "mock.tiktok" in videoUrl:
        return f"mock_download_path_{uuid.uuid4().hex[:6]}.mp4"
        
    # Download directly to a folder where NextJS or testing can find it
    output_folder = os.path.normpath(os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "tests", "data", "downloads"
    ))
    os.makedirs(output_folder, exist_ok=True)
    
    timestamp = int(time.time())
    output_filename = f"tiktok_{timestamp}.mp4"
    output_path = os.path.join(output_folder, output_filename)
    
    print(f"⬇️ Downloading video from: {videoUrl}")
    
    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'outtmpl': output_path,
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'prefer_free_formats': True
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([videoUrl])
        print(f"✅ Download complete! File saved at: {output_path}")
        return output_path
    except Exception as e:
        print(f"❌ yt-dlp Error: {e}")
        return "download_failed.mp4"

# ═══════════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════════

def get_tools():
    """Return all tools for the summarize subagent."""
    return [
        summarize_fetch_material_from_cloud,
        summarize_search_tiktok,
        summarize_download_tiktok
    ]
