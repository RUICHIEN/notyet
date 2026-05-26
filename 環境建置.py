# 步驟一：安裝核心套件（請在終端執行以下命令）
# pip install mediapipe opencv-python numpy

# 步驟二：匯入套件
import cv2
import mediapipe as mp
import numpy as np

# 步驟三：初始化 MediaPipe Pose 解決方案
if hasattr(mp, 'solutions'):
	mp_pose = mp.solutions.pose
	mp_drawing = mp.solutions.drawing_utils

	# 步驟四：建立 Pose 物件（關鍵參數設定）
	pose = mp_pose.Pose(
		static_image_mode=False, # False = 連續視訊串流模式
		model_complexity=1, # 0=輕量, 1=標準, 2=高精度
		smooth_landmarks=True, # 啟用關鍵點平滑化
		min_detection_confidence=0.5, # 初始偵測信心閾值
		min_tracking_confidence=0.5 # 持續追蹤信心閾值
	)

	print("MediaPipe Pose 初始化完成（solutions API）！")
else:
	# 針對新版本 mediapipe (tasks API) 提供友善提示
	print("注意：此環境的 mediapipe 版本沒有 'solutions' API。")
	if hasattr(mp, 'tasks'):
		print("已偵測到 mediapipe.tasks；若需使用 PoseLandmarker，請提供模型檔並改用 tasks API。")
	else:
		print("mediapipe 模組不包含可用的 Pose API。請檢查安裝版本或需求。")