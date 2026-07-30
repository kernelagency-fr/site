# -*- coding: utf-8 -*-
"""Variante de cdp_shot : scrolle jusqu'a un ancrage avant capture.
Usage: python tools-cdp_scroll_shot.py URL OUT WAIT_S SCROLL_JS [W H]
SCROLL_JS: expression JS executee apres le wait initial (ex: scroll)."""
import base64, json, subprocess, sys, time, urllib.request
import websocket

url, out = sys.argv[1], sys.argv[2]
wait_s = float(sys.argv[3]) if len(sys.argv) > 3 else 8.0
scroll_js = sys.argv[4] if len(sys.argv) > 4 else ""
w = sys.argv[5] if len(sys.argv) > 5 else "1440"
h = sys.argv[6] if len(sys.argv) > 6 else "900"
port = 9334
chrome = subprocess.Popen([
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "--headless=new", f"--remote-debugging-port={port}", "--remote-allow-origins=*",
    f"--window-size={w},{h}", "--hide-scrollbars", "--mute-audio",
    "--user-data-dir=" + r"C:\Users\arthu\AppData\Local\Temp\kernel-shots\chrome-profile-2",
    "about:blank",
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    ws_url = None
    for _ in range(50):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{port}/json"))
            page = next(t for t in tabs if t["type"] == "page")
            ws_url = page["webSocketDebuggerUrl"]
            break
        except Exception:
            time.sleep(0.3)
    ws = websocket.create_connection(ws_url, timeout=30)
    mid = [0]
    def send(method, params=None):
        mid[0] += 1
        ws.send(json.dumps({"id": mid[0], "method": method, "params": params or {}}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get("id") == mid[0]:
                return msg.get("result", {})
    send("Page.enable")
    send("Runtime.enable")
    send("Page.navigate", {"url": url})
    time.sleep(wait_s)
    if scroll_js:
        send("Runtime.evaluate", {"expression": scroll_js})
        time.sleep(1.8)  # laisse les reveals se jouer
    shot = send("Page.captureScreenshot", {"format": "png"})
    open(out, "wb").write(base64.b64decode(shot["data"]))
    print("OK", out)
finally:
    chrome.terminate()
