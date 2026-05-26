const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const expressionEl = document.getElementById('expression');
const detailsEl = document.getElementById('details');

function resizeCanvasToVideo() {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
}

function dist(a, b) {
  const dx = a.x - b.x; const dy = a.y - b.y; return Math.hypot(dx, dy);
}

function detectExpression(landmarks) {
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const leftEyeUp = landmarks[159];
  const leftEyeDown = landmarks[145];

  const rightEyeOuter = landmarks[362];
  const rightEyeInner = landmarks[263];
  const rightEyeUp = landmarks[386];
  const rightEyeDown = landmarks[374];

  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const mouthTop = landmarks[13];
  const mouthBottom = landmarks[14];

  const leftCheek = landmarks[234] || leftEyeOuter;
  const rightCheek = landmarks[454] || rightEyeOuter;
  const faceWidth = dist(leftCheek, rightCheek);

  const mouthWidth = dist(mouthLeft, mouthRight);
  const mouthOpen = dist(mouthTop, mouthBottom);

  const mouthCenterY = (mouthTop.y + mouthBottom.y) / 2;
  const mouthCornerAvgY = (mouthLeft.y + mouthRight.y) / 2;
  const mouthCornerRise = mouthCenterY - mouthCornerAvgY;

  const leftEAR = dist(leftEyeUp, leftEyeDown) / Math.max(dist(leftEyeOuter, leftEyeInner), 0.001);
  const rightEAR = dist(rightEyeUp, rightEyeDown) / Math.max(dist(rightEyeOuter, rightEyeInner), 0.001);
  const avgEAR = (leftEAR + rightEAR) / 2;

  const smileScore = Math.min(1, (mouthWidth / Math.max(faceWidth, 0.001)) + mouthCornerRise * 1.8);
  const openMouthScore = mouthOpen / Math.max(faceWidth, 0.001);
  const eyebrowRatio = ((landmarks[70].y + landmarks[300].y) / 2 - (landmarks[159].y + landmarks[386].y) / 2) / Math.max(faceWidth, 0.001);

  const isBlink = avgEAR < 0.02;
  const isSmiling = smileScore > 0.45 && openMouthScore < 0.15;
  const isSurprised = openMouthScore > 0.16 && eyebrowRatio > -0.01;
  const isMouthOpen = openMouthScore > 0.12;

  const browInnerDist = dist(landmarks[70], landmarks[300]) / Math.max(faceWidth, 0.001);
  const mouthCornerDown = Math.max(0, ((mouthLeft.y + mouthRight.y) / 2 - mouthCenterY) * 3);

  const happyScore = Math.min(1, Math.max(0, smileScore * 0.95 + openMouthScore * 0.15));
  const smilePct = Math.min(1, Math.max(0, smileScore * 1.1));
  const angryScore = Math.min(1, Math.max(0, 0.6 - browInnerDist + (1 - openMouthScore) * 0.15 + (1 - smileScore) * 0.2));
  const sadScore = Math.min(1, Math.max(0, (1 - smileScore) * 0.6 + mouthCornerDown * 0.9 - openMouthScore * 0.2));

  const list = [];
  if (isSurprised) list.push('驚訝');
  else if (isSmiling) list.push('微笑');
  else if (isMouthOpen) list.push('張嘴');
  if (isBlink) list.push('眨眼');
  if (list.length === 0) list.push('中性');

  const labels = list.join(' · ');
  const metrics = {
    happyScore: Math.round(happyScore * 100),
    angryScore: Math.round(angryScore * 100),
    sadScore: Math.round(sadScore * 100),
    smileScore: Math.round(smilePct * 100)
  };

  return { labels, metrics };
}

function onResults(results) {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    expressionEl.textContent = '無人臉偵測到';
    detailsEl.textContent = '';
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    return;
  }

  resizeCanvasToVideo();

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  for (const landmarks of results.multiFaceLandmarks) {
    // draw landmarks（若繪圖工具可用）
    if (drawConnectors && FACEMESH_TESSELATION) {
      try { drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C0', lineWidth: 1 }); } catch (e) {}
    }
    if (drawLandmarks) {
      try { drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', radius: 1 }); } catch (e) {}
    }

    const expr = detectExpression(landmarks);
    expressionEl.textContent = expr.labels;
    detailsEl.textContent = `指標：開心 ${expr.metrics.happyScore}% · 生氣 ${expr.metrics.angryScore}% · 哀傷 ${expr.metrics.sadScore}% · 微笑 ${expr.metrics.smileScore}%`;
    document.getElementById('happyScore').textContent = `${expr.metrics.happyScore}%`;
    document.getElementById('angryScore').textContent = `${expr.metrics.angryScore}%`;
    document.getElementById('sadScore').textContent = `${expr.metrics.sadScore}%`;
    document.getElementById('smileScoreLabel').textContent = `${expr.metrics.smileScore}%`;
  }

  canvasCtx.restore();
}

// 嘗試找出不同載入方式下的 FaceMesh constructor 與繪圖工具
let FaceMeshCtor = null;
if (window.FaceMesh && typeof window.FaceMesh === 'function') FaceMeshCtor = window.FaceMesh;
else if (window.FaceMesh && window.FaceMesh.FaceMesh) FaceMeshCtor = window.FaceMesh.FaceMesh;
else if (window.Mediapipe && window.Mediapipe.FaceMesh) FaceMeshCtor = window.Mediapipe.FaceMesh;

const drawConnectors = window.drawConnectors || (window.drawingUtils && window.drawingUtils.drawConnectors) || null;
const drawLandmarks = window.drawLandmarks || (window.drawingUtils && window.drawingUtils.drawLandmarks) || null;
const FACEMESH_TESSELATION = window.FACEMESH_TESSELATION || (window.FaceMesh && window.FaceMesh.FACEMESH_TESSELATION) || null;

let faceMesh = null;
try {
  if (!FaceMeshCtor) throw new Error('FaceMesh constructor not found (檢查 CDN 檔案是否載入)');
  faceMesh = new FaceMeshCtor({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
  faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  faceMesh.onResults(onResults);
} catch (e) {
  console.error('FaceMesh 初始化錯誤', e);
  detailsEl.textContent = 'FaceMesh 初始化錯誤：' + e.message;
}

const startBtn = document.getElementById('startCamera');

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    expressionEl.textContent = '此瀏覽器不支援相機存取';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
    videoElement.srcObject = stream;
    await videoElement.play();

    // 使用 requestAnimationFrame 送影格給 faceMesh
    async function frameLoop() {
      try {
        await faceMesh.send({ image: videoElement });
      } catch (e) {
        // ignore per-frame errors
      }
      requestAnimationFrame(frameLoop);
    }
    requestAnimationFrame(frameLoop);
  } catch (err) {
    expressionEl.textContent = '相機存取被拒或發生錯誤';
    detailsEl.textContent = String(err);
  }
}

startBtn.addEventListener('click', startCamera);


