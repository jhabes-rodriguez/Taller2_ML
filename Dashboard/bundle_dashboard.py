import os
import json
import re

def bundle():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Files to Bundle
    index_path = os.path.join(base_dir, "index.html")
    style_path = os.path.join(base_dir, "style.css")
    js_path = os.path.join(base_dir, "app.js")
    
    # JSON Data to Embed
    data_files = {
        "matchups": "data/matchups.json",
        "shots": "data/shots_map.json",
        "eda": "data/eda_stats.json",
        "clusters": "data/player_clusters.json"
    }
    
    print("--- 1. Reading Base Files ---")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
    with open(style_path, "r", encoding="utf-8") as f:
        css = f.read()
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()
        
    print("--- 2. Loading JSON Data ---")
    embedded_data = {}
    for key, rel_path in data_files.items():
        full_path = os.path.join(base_dir, rel_path)
        if os.path.exists(full_path):
            with open(full_path, "r", encoding="utf-8") as f:
                embedded_data[key] = json.load(f)
        else:
            print(f"Warning: {rel_path} not found!")
            embedded_data[key] = None

    print("--- 3. Injecting Data into JS ---")
    # Add the global data object at the top of JS
    data_injection = f"\nwindow.DASHBOARD_DATA = {json.dumps(embedded_data)};\n"
    js = data_injection + js
    
    # Replace fetch calls in JS with local data access
    # Patterns to match: await fetch('./data/matchups.json') -> Promise.resolve({ json: () => window.DASHBOARD_DATA.matchups })
    js = js.replace("await fetch('./data/matchups.json')", "Promise.resolve({ json: () => window.DASHBOARD_DATA.matchups })")
    js = js.replace("await fetch('./data/shots_map.json')", "Promise.resolve({ json: () => window.DASHBOARD_DATA.shots })")
    js = js.replace("await fetch('./data/eda_stats.json')", "Promise.resolve({ json: () => window.DASHBOARD_DATA.eda })")
    js = js.replace("await fetch('./data/player_clusters.json')", "Promise.resolve({ json: () => window.DASHBOARD_DATA.clusters })")

    print("--- 4. Assembling Standalone HTML ---")
    # Replace the Link and Script tags by finding their positions (more robust than regex sub with large strings)
    
    # CSS Replacement
    css_pattern = re.compile(r'<link.*href="style\.css.*>')
    html = css_pattern.sub(f"<style>\n{css}\n</style>", html)
    
    # JS Replacement - using a lambda or simple replacement to avoid escape char issues
    # We find the script tag, and replace it manually to avoid regex sub backreference errors
    js_tag_pattern = re.compile(r'<script.*src="app\.js.*></script>')
    match = js_tag_pattern.search(html)
    if match:
        start, end = match.span()
        html = html[:start] + f"<script>\n{js}\n</script>" + html[end:]
    else:
        print("Warning: app.js script tag not found in HTML!")
    
    # Save the standalone file
    output_path = os.path.join(base_dir, "standalone_dashboard.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
        
    print(f"Done! Standalone dashboard created at: {output_path}")

if __name__ == "__main__":
    bundle()
