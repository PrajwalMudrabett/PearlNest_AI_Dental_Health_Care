from ultralytics import YOLO

MODEL_PATH = r"runs\detect\train-3\weights\best.pt"

IMAGE_PATH = r"dataset3_findings\test\images\cate1-00007_jpg.rf.xZ7gUIZa9Yr38nP3OXMk.jpg"

FDI_CLASSES = [
    11, 12, 13, 14, 15, 16, 17, 18,
    21, 22, 23, 24, 25, 26, 27, 28,
    31, 32, 33, 34, 35, 36, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48
]

model = YOLO(MODEL_PATH)

for conf in [0.10, 0.25, 0.40, 0.50, 0.60]:

    result = model.predict(
        source=IMAGE_PATH,
        imgsz=640,
        conf=conf,
        iou=0.50,
        device=0,
        verbose=False
    )[0]

    detections = []

    if result.boxes is not None:

        classes = result.boxes.cls.cpu().numpy().astype(int)
        confidences = result.boxes.conf.cpu().numpy()

        for cls, confidence in zip(classes, confidences):

            if cls < len(FDI_CLASSES):

                detections.append(
                    (
                        FDI_CLASSES[cls],
                        float(confidence)
                    )
                )

    unique_fdi = sorted(set(
        fdi for fdi, conf_value in detections
    ))

    print("\n===================================")
    print(f"CONFIDENCE THRESHOLD: {conf}")
    print("===================================")

    print(f"Raw detections : {len(detections)}")
    print(f"Unique FDI     : {len(unique_fdi)}")

    print("\nPredictions:")

    for fdi, confidence in sorted(detections):

        print(
            f"FDI {fdi} "
            f"confidence={confidence:.2f}"
        )