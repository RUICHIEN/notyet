# Mediapipe 臉部表情偵測網頁

簡單的靜態網頁示範，使用 MediaPipe FaceMesh 在瀏覽器上偵測臉部關鍵點，並以簡單啟發式規則估計表情（微笑、張嘴、眨眼）。

啟動方式：

1. 在專案根目錄啟動簡易 HTTP 伺服器：
```bash
cd web
python3 -m http.server 8000
```
2. 在瀏覽器打開：
```
http://localhost:8000
```

注意事項：
- 需允許使用相機（HTTPS 或 localhost）。
- 本範例使用 CDN 的 MediaPipe JS 套件。
- 目前示範會直接使用 FaceMesh landmarks 進行表情推論，不需要使用者自行訓練模型。
