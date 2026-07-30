# -*- coding: utf-8 -*-
"""Capture d'écran Chrome headless en TEMPS RÉEL (CDP) — laisse les intros GSAP se jouer."""
import base64, json, subprocess, sys, time, urllib.request
import websocket

url, out, wait_s = sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 8.0
port = 9333
chrome = subprocess.Popen([
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "--headless=new", f"--remote-debugging-port={port}", "--remote-allow-origins=*",
    "--window-size=1440,900", "--hide-scrollbars", "--mute-audio",
    "--user-data-dir=" + r"C:\Users\arthu\AppData\Local\Temp\kernel-shots\chrome-profile",
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
    send("Page.navigate", {"url": url})
    time.sleep(wait_s)  # temps RÉEL : les intros GSAP/rAF se jouent
    shot = send("Page.captureScreenshot", {"format": "png"})
    open(out, "wb").write(base64.b64decode(shot["data"]))
    print("OK", out)
finally:
    chrome.terminate()
