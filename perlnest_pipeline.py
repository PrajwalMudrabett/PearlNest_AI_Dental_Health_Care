import cv2

import numpy as np

import pandas as pd

from ultralytics import YOLO

# ============================================================

# PERLNEST - MODEL PATHS

# ============================================================

MODEL1_PATH = r"runs\detect\runs\detect\train-model1-retrained\weights\best.pt"

MODEL2_PATH = r"runs\segment\train-2\weights\best.pt"

MODEL3_PATH = r"runs\segment\runs\segment\model3-filling-segmentation\weights\best.pt"

# ============================================================

# FDI CLASS MAPPING

# ============================================================

FDI_CLASSES = [

    11, 12, 13, 14, 15, 16, 17, 18,

    21, 22, 23, 24, 25, 26, 27, 28,

    31, 32, 33, 34, 35, 36, 37, 38,

    41, 42, 43, 44, 45, 46, 47, 48

]

# ============================================================

# MODEL 3 FINDING CLASSES

# ============================================================

FINDING_CLASSES = [

    "Implant",

    "Filling",

    "Composite filling",

    "Amalgam filling",

    "Crown"

]

# ============================================================

# COLORS - BGR

# ============================================================

COLOR_TOOTH = (0, 255, 0)

COLOR_CARIES = (0, 0, 255)

FINDING_COLORS = {

    "Implant": (255, 0, 0),

    "Filling": (0, 165, 255),

    "Composite filling": (255, 255, 0),

    "Amalgam filling": (0, 255, 255),

    "Crown": (255, 0, 255)

}

# ============================================================

# LOAD MODELS

# ============================================================

print("Loading PERLNEST models...")

model1 = YOLO(MODEL1_PATH)

model2 = YOLO(MODEL2_PATH)

model3 = YOLO(MODEL3_PATH)

print("All three models loaded successfully.")

# ============================================================

# DEDUPLICATE TEETH

# ============================================================

def deduplicate_teeth(boxes, classes, confidences):

    best = {}

    for box, cls, conf in zip(

        boxes,

        classes,

        confidences

    ):

        cls = int(cls)

        conf = float(conf)

        if cls < 0 or cls >= len(FDI_CLASSES):

            continue

        fdi = FDI_CLASSES[cls]

        if (

            fdi not in best

            or conf > best[fdi]["confidence"]

        ):

            best[fdi] = {

                "fdi": fdi,

                "box": box,

                "confidence": conf

            }

    return list(best.values())

# ============================================================

# CALCULATE MASK OVERLAP

# ============================================================



def suppress_duplicate_teeth(teeth, iou_threshold=0.60):
    """Suppress near-identical overlapping tooth boxes conservatively."""
    ordered = sorted(teeth, key=lambda tooth: tooth["confidence"], reverse=True)
    kept = []

    for candidate in ordered:
        ax1, ay1, ax2, ay2 = map(float, candidate["box"])
        duplicate = False

        for previous in kept:
            bx1, by1, bx2, by2 = map(float, previous["box"])
            ix1, iy1 = max(ax1, bx1), max(ay1, by1)
            ix2, iy2 = min(ax2, bx2), min(ay2, by2)
            intersection = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
            area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
            area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
            union = area_a + area_b - intersection
            iou = intersection / union if union > 0 else 0.0

            if iou >= iou_threshold:
                duplicate = True
                break

        if not duplicate:
            kept.append(candidate)

    return kept

def calculate_overlap(

    tooth_box,

    finding_mask

):

    x1, y1, x2, y2 = map(

        int,

        tooth_box

    )

    h, w = finding_mask.shape[:2]

    x1 = max(

        0,

        min(x1, w - 1)

    )

    x2 = max(

        0,

        min(x2, w)

    )

    y1 = max(

        0,

        min(y1, h - 1)

    )

    y2 = max(

        0,

        min(y2, h)

    )

    if x2 <= x1 or y2 <= y1:

        return 0.0

    finding_area = np.sum(

        finding_mask > 0

    )

    if finding_area == 0:

        return 0.0

    tooth_region = finding_mask[

        y1:y2,

        x1:x2

    ]

    overlap_area = np.sum(

        tooth_region > 0

    )

    return float(

        overlap_area / finding_area

    )

# ============================================================

# DRAW SEMI-TRANSPARENT MASK

# ============================================================

def draw_mask(

    image,

    mask,

    color,

    alpha=0.10

):

    overlay = image.copy()

    overlay[mask] = color

    return cv2.addWeighted(

        image,

        1 - alpha,

        overlay,

        alpha,

        0

    )

# ============================================================

# DRAW MASK CONTOUR

# ============================================================

def draw_mask_contour(

    image,

    mask,

    color,

    thickness=1

):

    mask_uint8 = (

        mask.astype(np.uint8) * 255

    )

    contours, _ = cv2.findContours(

        mask_uint8,

        cv2.RETR_EXTERNAL,

        cv2.CHAIN_APPROX_SIMPLE

    )

    cv2.drawContours(

        image,

        contours,

        -1,

        color,

        thickness

    )

    return image

# ============================================================

# RECTANGLE OVERLAP CHECK

# ============================================================

def rectangles_overlap(

    a,

    b

):

    return not (

        a[2] < b[0]

        or a[0] > b[2]

        or a[3] < b[1]

        or a[1] > b[3]

    )

# ============================================================

# COLLISION-AWARE FDI LABELS

# ============================================================

def draw_fdi_labels(

    image,

    teeth

):

    if not teeth:

        return image

    sorted_teeth = sorted(

        teeth,

        key=lambda t: (

            int(t["box"][0]),

            int(t["box"][1])

        )

    )

    font = cv2.FONT_HERSHEY_SIMPLEX

    font_scale = 0.42

    thickness = 2

    placed_labels = []

    for tooth in sorted_teeth:

        x1, y1, x2, y2 = map(

            int,

            tooth["box"]

        )

        fdi = str(

            tooth["fdi"]

        )

        (

            text_width,

            text_height

        ), baseline = cv2.getTextSize(

            fdi,

            font,

            font_scale,

            thickness

        )

        label_width = (

            text_width + 8

        )

        label_height = (

            text_height

            + baseline

            + 6

        )

        # ----------------------------------------------------

        # Possible positions

        # ----------------------------------------------------

        candidates = [

            # Above

            (

                x1,

                y1 - label_height - 2

            ),

            # Inside top-left

            (

                x1,

                y1 + 2

            ),

            # Above top-right

            (

                x2 - label_width,

                y1 - label_height - 2

            ),

            # Inside top-right

            (

                x2 - label_width,

                y1 + 2

            ),

            # Below

            (

                x1,

                y2 + 2

            )

        ]

        chosen = None

        # ----------------------------------------------------

        # Find non-overlapping position

        # ----------------------------------------------------

        for candidate_x, candidate_y in candidates:

            rect = (

                candidate_x,

                candidate_y,

                candidate_x + label_width,

                candidate_y + label_height

            )

            overlap = False

            for previous in placed_labels:

                if rectangles_overlap(

                    rect,

                    previous

                ):

                    overlap = True

                    break

            if not overlap:

                chosen = rect

                break

        # ----------------------------------------------------

        # Fallback vertical placement

        # ----------------------------------------------------

        if chosen is None:

            candidate_x = x1

            candidate_y = max(

                2,

                y1 - label_height - 2

            )

            for _ in range(20):

                rect = (

                    candidate_x,

                    candidate_y,

                    candidate_x + label_width,

                    candidate_y + label_height

                )

                overlap = False

                for previous in placed_labels:

                    if rectangles_overlap(

                        rect,

                        previous

                    ):

                        overlap = True

                        break

                if not overlap:

                    chosen = rect

                    break

                candidate_y += (

                    label_height + 3

                )

        # ----------------------------------------------------

        # Final fallback

        # ----------------------------------------------------

        if chosen is None:

            chosen = (

                x1,

                max(

                    2,

                    y1 - label_height - 2

                ),

                x1 + label_width,

                max(

                    2,

                    y1 - label_height - 2

                ) + label_height

            )

        lx1, ly1, _, _ = chosen

        # Keep label inside image.

        lx1 = max(

            0,

            min(

                lx1,

                image.shape[1] - label_width

            )

        )

        ly1 = max(

            0,

            min(

                ly1,

                image.shape[0] - label_height

            )

        )

        final_rect = (

            lx1,

            ly1,

            lx1 + label_width,

            ly1 + label_height

        )

        placed_labels.append(

            final_rect

        )

        # ----------------------------------------------------

        # Black label background

        # ----------------------------------------------------

        cv2.rectangle(

            image,

            (

                lx1,

                ly1

            ),

            (

                lx1 + label_width,

                ly1 + label_height

            ),

            (0, 0, 0),

            -1

        )

        # ----------------------------------------------------

        # Green FDI number

        # ----------------------------------------------------

        cv2.putText(

            image,

            fdi,

            (

                lx1 + 4,

                ly1 + text_height + 1

            ),

            font,

            font_scale,

            COLOR_TOOTH,

            thickness,

            cv2.LINE_AA

        )

    return image

# ============================================================

# DRAW TOOTH BOX

# ============================================================

def draw_tooth_box(

    image,

    tooth

):

    x1, y1, x2, y2 = map(

        int,

        tooth["box"]

    )

    cv2.rectangle(

        image,

        (x1, y1),

        (x2, y2),

        COLOR_TOOTH,

        2

    )

    return image

# ============================================================

# ANALYZE IMAGE

# ============================================================

def analyze_image(

    image,

    model1_conf=0.25,

    model2_conf=0.25,

    model3_conf=0.50

):

    if image is None:

        raise ValueError(

            "Input image could not be loaded."

        )

    original = image.copy()

    height, width = original.shape[:2]

    # ========================================================

    # MODEL 1

    # TOOTH DETECTION + FDI

    # ========================================================

    result1 = model1.predict(

        source=original,

        conf=model1_conf,

        imgsz=896,

        verbose=False

    )[0]

    teeth = []

    if result1.boxes is not None:

        boxes = (

            result1.boxes

            .xyxy

            .cpu()

            .numpy()

        )

        classes = (

            result1.boxes

            .cls

            .cpu()

            .numpy()

        )

        confidences = (

            result1.boxes

            .conf

            .cpu()

            .numpy()

        )

        teeth = deduplicate_teeth(

            boxes,

            classes,

            confidences

        )

        teeth = suppress_duplicate_teeth(teeth, iou_threshold=0.60)

    # ========================================================

    # MODEL 2

    # CARIES

    # ========================================================

    result2 = model2.predict(

        source=original,

        conf=model2_conf,

        imgsz=512,

        retina_masks=True,

        verbose=False

    )[0]

    caries_masks = []

    if (

        result2.masks is not None

        and result2.boxes is not None

    ):

        masks = (

            result2.masks

            .data

            .cpu()

            .numpy()

        )

        for i, mask in enumerate(masks):

            mask = cv2.resize(

                mask,

                (width, height),

                interpolation=cv2.INTER_NEAREST

            )

            confidence = float(

                result2.boxes

                .conf[i]

                .cpu()

                .item()

            )

            caries_masks.append({

                "mask": mask > 0.5,

                "confidence":

                    confidence

            })

    # ========================================================

    # MODEL 3

    # FINDINGS

    # ========================================================

    result3 = model3.predict(

        source=original,

        conf=model3_conf,

        imgsz=512,

        retina_masks=True,

        verbose=False

    )[0]

    findings = []

    if (

        result3.masks is not None

        and result3.boxes is not None

    ):

        masks = (

            result3.masks

            .data

            .cpu()

            .numpy()

        )

        classes = (

            result3.boxes

            .cls

            .cpu()

            .numpy()

        )

        confidences = (

            result3.boxes

            .conf

            .cpu()

            .numpy()

        )

        for i, mask in enumerate(masks):

            mask = cv2.resize(

                mask,

                (width, height),

                interpolation=cv2.INTER_NEAREST

            )

            cls = int(

                classes[i]

            )

            if (

                cls < 0

                or cls >= len(FINDING_CLASSES)

            ):

                continue

            findings.append({

                "type":

                    FINDING_CLASSES[cls],

                "mask":

                    mask > 0.5,

                "confidence":

                    float(confidences[i])

            })

    # ========================================================

    # TOOTH-WISE ASSIGNMENTS

    # ========================================================

    tooth_assignments = {

        tooth["fdi"]: []

        for tooth in teeth

    }

    finding_assignments = []

    # ========================================================

    # ASSIGN FINDINGS TO BEST TOOTH

    # ========================================================

    for finding in findings:

        best_tooth = None

        best_overlap = 0.0

        for tooth in teeth:

            overlap = calculate_overlap(

                tooth["box"],

                finding["mask"]

            )

            if overlap > best_overlap:

                best_overlap = overlap

                best_tooth = tooth

        if (

            best_tooth is not None

            and best_overlap >= 0.15

        ):

            assignment = {

                "finding":

                    finding["type"],

                "confidence":

                    finding["confidence"],

                "overlap":

                    best_overlap

            }

            tooth_assignments[

                best_tooth["fdi"]

            ].append(

                assignment

            )

            finding_assignments.append({

                "type":

                    finding["type"],

                "mask":

                    finding["mask"],

                "confidence":

                    finding["confidence"],

                "fdi":

                    best_tooth["fdi"],

                "overlap":

                    best_overlap

            })

    # ========================================================

    # ASSIGN CARIES TO BEST TOOTH

    # ========================================================

    caries_assignments = []

    for caries in caries_masks:

        best_tooth = None

        best_overlap = 0.0

        for tooth in teeth:

            overlap = calculate_overlap(

                tooth["box"],

                caries["mask"]

            )

            if overlap > best_overlap:

                best_overlap = overlap

                best_tooth = tooth

        if (

            best_tooth is not None

            and best_overlap >= 0.15

        ):

            assignment = {

                "finding":

                    "Caries",

                "confidence":

                    caries["confidence"],

                "overlap":

                    best_overlap

            }

            tooth_assignments[

                best_tooth["fdi"]

            ].append(

                assignment

            )

            caries_assignments.append({

                "mask":

                    caries["mask"],

                "confidence":

                    caries["confidence"],

                "fdi":

                    best_tooth["fdi"],

                "overlap":

                    best_overlap

            })

    # ========================================================

    # DEDUPLICATE FINDINGS PER TOOTH

    # ========================================================

    for fdi in tooth_assignments:

        best_by_type = {}

        for finding in tooth_assignments[fdi]:

            finding_type = (

                finding["finding"]

            )

            if (

                finding_type not in best_by_type

                or

                finding["confidence"]

                >

                best_by_type[

                    finding_type

                ]["confidence"]

            ):

                best_by_type[

                    finding_type

                ] = finding

        tooth_assignments[fdi] = list(

            best_by_type.values()

        )

    # ========================================================

    # TOOTH-WISE DATAFRAME

    # ========================================================

    tooth_results = []

    for tooth in teeth:

        fdi = tooth["fdi"]

        assigned = (

            tooth_assignments[fdi]

        )

        if not assigned:

            tooth_results.append({

                "FDI":

                    fdi,

                "Tooth Confidence":

                    round(

                        tooth["confidence"],

                        3

                    ),

                "Finding":

                    "None",

                "Finding Confidence":

                    0.0,

                "Overlap":

                    0.0

            })

        else:

            for finding in assigned:

                tooth_results.append({

                    "FDI":

                        fdi,

                    "Tooth Confidence":

                        round(

                            tooth["confidence"],

                            3

                        ),

                    "Finding":

                        finding["finding"],

                    "Finding Confidence":

                        round(

                            finding["confidence"],

                            3

                        ),

                    "Overlap":

                        round(

                            finding["overlap"],

                            3

                        )

                })

    # ========================================================

    # CREATE CLEAN ANNOTATED IMAGE

    # ========================================================

    annotated = original.copy()

    # --------------------------------------------------------

    # CARIES MASK

    # --------------------------------------------------------

    for caries in caries_masks:

        annotated = draw_mask(

            annotated,

            caries["mask"],

            COLOR_CARIES,

            alpha=0.10

        )

        annotated = draw_mask_contour(

            annotated,

            caries["mask"],

            COLOR_CARIES,

            thickness=1

        )

    # --------------------------------------------------------

    # FINDING MASKS

    # --------------------------------------------------------

    for finding in findings:

        color = FINDING_COLORS.get(

            finding["type"],

            (255, 255, 255)

        )

        annotated = draw_mask(

            annotated,

            finding["mask"],

            color,

            alpha=0.10

        )

        annotated = draw_mask_contour(

            annotated,

            finding["mask"],

            color,

            thickness=1

        )

    # ========================================================

    # DRAW TOOTH BOXES

    # ========================================================

    sorted_teeth = sorted(

        teeth,

        key=lambda tooth: (

            int(tooth["box"][1]),

            int(tooth["box"][0])

        )

    )

    for tooth in sorted_teeth:

        annotated = draw_tooth_box(

            annotated,

            tooth

        )

    # ========================================================

    # DRAW FDI LABELS

    # ========================================================

    annotated = draw_fdi_labels(

        annotated,

        sorted_teeth

    )

    # ========================================================

    # RAW MODEL SUMMARY

    # ========================================================

    raw_summary = {

        "Teeth":

            len(teeth),

        "Caries":

            len(caries_masks),

        "Implant":

            sum(

                1

                for x in findings

                if x["type"] == "Implant"

            ),

        "Filling":

            sum(

                1

                for x in findings

                if x["type"] == "Filling"

            ),

        "Composite filling":

            sum(

                1

                for x in findings

                if x["type"]

                == "Composite filling"

            ),

        "Amalgam filling":

            sum(

                1

                for x in findings

                if x["type"]

                == "Amalgam filling"

            ),

        "Crown":

            sum(

                1

                for x in findings

                if x["type"] == "Crown"

            )

    }

    # ========================================================

    # TOOTH-WISE FUSED SUMMARY

    # ========================================================

    fused_summary = {

        "Teeth":

            len(teeth),

        "Caries":

            0,

        "Implant":

            0,

        "Filling":

            0,

        "Composite filling":

            0,

        "Amalgam filling":

            0,

        "Crown":

            0

    }

    for row in tooth_results:

        finding = row["Finding"]

        if finding in fused_summary:

            fused_summary[

                finding

            ] += 1

    # ========================================================

    # DATAFRAME

    # ========================================================

    dataframe = pd.DataFrame(

        tooth_results

    )

    # ========================================================

    # RETURN

    # ========================================================

    return {

        "original":

            original,

        "annotated":

            annotated,

        "teeth":

            teeth,

        "caries":

            caries_masks,

        "findings":

            findings,

        "finding_assignments":

            finding_assignments,

        "caries_assignments":

            caries_assignments,

        "tooth_assignments":

            tooth_assignments,

        "tooth_results":

            tooth_results,

        "dataframe":

            dataframe,

        # Backward-compatible summary

        "summary":

            raw_summary,

        "raw_summary":

            raw_summary,

        "fused_summary":

            fused_summary

    }
