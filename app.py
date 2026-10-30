import streamlit as st
import cv2
import numpy as np
import pandas as pd
from PIL import Image
from io import BytesIO

from perlnest_pipeline import analyze_image


# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="PERLNEST",
    page_icon="🦷",
    layout="wide",
    initial_sidebar_state="expanded"
)


# ============================================================
# HEADER
# ============================================================

st.title("PERLNEST")

st.markdown(
    "### Panoramic Dental X-Ray Analysis using Deep Learning"
)

st.markdown(
    "A research and educational prototype combining "
    "tooth detection, caries segmentation, and dental "
    "finding segmentation."
)


# ============================================================
# SIDEBAR
# ============================================================

st.sidebar.title("PERLNEST")

st.sidebar.markdown("### Analysis Controls")

model1_conf = st.sidebar.slider(
    "Tooth Detection Confidence",
    min_value=0.10,
    max_value=0.90,
    value=0.25,
    step=0.05
)

model2_conf = st.sidebar.slider(
    "Caries Confidence",
    min_value=0.10,
    max_value=0.90,
    value=0.25,
    step=0.05
)

model3_conf = st.sidebar.slider(
    "Dental Findings Confidence",
    min_value=0.10,
    max_value=0.90,
    value=0.50,
    step=0.05
)

st.sidebar.markdown("---")

st.sidebar.markdown(
    """
    **Models**

    • Model 1 — FDI Tooth Detection  
    • Model 2 — Caries Segmentation  
    • Model 3 — Dental Findings Segmentation
    """
)

st.sidebar.markdown("---")

st.sidebar.info(
    "Research / educational prototype. "
    "Not intended for clinical diagnosis."
)


# ============================================================
# HELPER FUNCTION
# ============================================================

def get_fused_summary(dataframe):
    """
    Calculate finding counts from the tooth-wise fused
    dataframe rather than using raw Model 3 predictions.
    """

    summary = {
        "Teeth": 0,
        "Caries": 0,
        "Implant": 0,
        "Filling": 0,
        "Composite filling": 0,
        "Amalgam filling": 0,
        "Crown": 0
    }

    if dataframe is None or dataframe.empty:
        return summary

    # Number of unique detected teeth
    if "FDI" in dataframe.columns:
        summary["Teeth"] = dataframe["FDI"].nunique()

    # Count each finding from fused tooth-wise results
    if "Finding" in dataframe.columns:

        findings = dataframe["Finding"].dropna()

        findings = findings[
            findings.astype(str).str.lower() != "none"
        ]

        for finding in summary:

            if finding == "Teeth":
                continue

            summary[finding] = int(
                (findings == finding).sum()
            )

    return summary


# ============================================================
# TABS
# ============================================================

analysis_tab, performance_tab, about_tab = st.tabs(
    [
        "🦷 X-Ray Analysis",
        "📊 Model Performance",
        "ℹ️ About PERLNEST"
    ]
)


# ============================================================
# X-RAY ANALYSIS TAB
# ============================================================

with analysis_tab:

    st.header("X-Ray Analysis")

    st.write(
        "Upload a panoramic dental X-ray image and run "
        "the complete PERLNEST analysis pipeline."
    )

    # --------------------------------------------------------
    # FILE UPLOAD
    # --------------------------------------------------------

    uploaded_file = st.file_uploader(
        "Upload Panoramic Dental X-Ray",
        type=["jpg", "jpeg", "png"],
        help="Supported formats: JPG, JPEG and PNG."
    )

    # --------------------------------------------------------
    # PROCESS UPLOADED IMAGE
    # --------------------------------------------------------

    if uploaded_file is not None:

        image_bytes = uploaded_file.read()

        try:

            pil_image = Image.open(
                BytesIO(image_bytes)
            ).convert("RGB")

            image_rgb = np.array(
                pil_image
            )

            image_bgr = cv2.cvtColor(
                image_rgb,
                cv2.COLOR_RGB2BGR
            )

        except Exception as e:

            st.error(
                f"Could not read the uploaded image: {e}"
            )

            st.stop()


        # ----------------------------------------------------
        # ORIGINAL IMAGE
        # ----------------------------------------------------

        st.subheader("Uploaded X-Ray")

        st.image(
            image_rgb,
            use_container_width=True
        )


        # ----------------------------------------------------
        # ANALYZE BUTTON
        # ----------------------------------------------------

        analyze_button = st.button(
            "🔍 Analyze X-Ray",
            type="primary",
            use_container_width=True
        )


        if analyze_button:

            with st.spinner(
                "Running PERLNEST models..."
            ):

                try:

                    result = analyze_image(
                        image_bgr,
                        model1_conf=model1_conf,
                        model2_conf=model2_conf,
                        model3_conf=model3_conf
                    )

                    # Store result
                    st.session_state[
                        "perlnest_result"
                    ] = result

                    # Store original image
                    st.session_state[
                        "perlnest_original"
                    ] = image_rgb

                    st.success(
                        "Analysis completed successfully."
                    )

                except Exception as e:

                    st.error(
                        "Analysis failed."
                    )

                    st.exception(e)

                    st.stop()


    # ========================================================
    # DISPLAY ANALYSIS RESULT
    # ========================================================

    if "perlnest_result" in st.session_state:

        result = st.session_state[
            "perlnest_result"
        ]

        original_image = st.session_state.get(
            "perlnest_original",
            None
        )


        # ----------------------------------------------------
        # ANNOTATED IMAGE
        # ----------------------------------------------------

        st.markdown("---")

        st.subheader("Analysis Visualization")


        annotated_bgr = result.get(
            "annotated",
            None
        )


        if annotated_bgr is not None:

            annotated_rgb = cv2.cvtColor(
                annotated_bgr,
                cv2.COLOR_BGR2RGB
            )

            image_col1, image_col2 = st.columns(2)


            with image_col1:

                st.markdown("#### Original X-Ray")

                if original_image is not None:

                    st.image(
                        original_image,
                        use_container_width=True
                    )


            with image_col2:

                st.markdown("#### PERLNEST Output")

                st.image(
                    annotated_rgb,
                    use_container_width=True
                )


        # ----------------------------------------------------
        # TOOTH-WISE DATAFRAME
        # ----------------------------------------------------

        dataframe = result.get(
            "dataframe",
            pd.DataFrame()
        )


        if dataframe is None:

            dataframe = pd.DataFrame()


        # ----------------------------------------------------
        # FUSED SUMMARY
        # ----------------------------------------------------

        st.markdown("---")

        st.subheader(
            "Analysis Summary"
        )


        # IMPORTANT:
        # Use tooth-wise fused results instead of raw
        # Model 3 prediction counts.

        fused_summary = get_fused_summary(
            dataframe
        )


        # ----------------------------------------------------
        # METRIC CARDS
        # ----------------------------------------------------

        metric_columns = st.columns(4)


        with metric_columns[0]:

            st.metric(
                "Teeth",
                fused_summary["Teeth"]
            )


        with metric_columns[1]:

            st.metric(
                "Caries",
                fused_summary["Caries"]
            )


        with metric_columns[2]:

            st.metric(
                "Implants",
                fused_summary["Implant"]
            )


        with metric_columns[3]:

            st.metric(
                "Fillings",
                fused_summary["Filling"]
            )


        metric_columns_2 = st.columns(3)


        with metric_columns_2[0]:

            st.metric(
                "Composite",
                fused_summary["Composite filling"]
            )


        with metric_columns_2[1]:

            st.metric(
                "Amalgam",
                fused_summary["Amalgam filling"]
            )


        with metric_columns_2[2]:

            st.metric(
                "Crowns",
                fused_summary["Crown"]
            )


        # ----------------------------------------------------
        # RAW MODEL PREDICTIONS
        # ----------------------------------------------------

        with st.expander(
            "View Raw Model Prediction Counts"
        ):

            raw_summary = result.get(
                "summary",
                {}
            )

            raw_data = pd.DataFrame(
                [
                    {
                        "Output": "Teeth",
                        "Raw Count": raw_summary.get(
                            "Teeth",
                            0
                        )
                    },
                    {
                        "Output": "Caries",
                        "Raw Count": raw_summary.get(
                            "Caries",
                            0
                        )
                    },
                    {
                        "Output": "Implant",
                        "Raw Count": raw_summary.get(
                            "Implant",
                            0
                        )
                    },
                    {
                        "Output": "Filling",
                        "Raw Count": raw_summary.get(
                            "Filling",
                            0
                        )
                    },
                    {
                        "Output": "Composite filling",
                        "Raw Count": raw_summary.get(
                            "Composite filling",
                            0
                        )
                    },
                    {
                        "Output": "Amalgam filling",
                        "Raw Count": raw_summary.get(
                            "Amalgam filling",
                            0
                        )
                    },
                    {
                        "Output": "Crown",
                        "Raw Count": raw_summary.get(
                            "Crown",
                            0
                        )
                    }
                ]
            )

            st.dataframe(
                raw_data,
                use_container_width=True,
                hide_index=True
            )

            st.caption(
                "Raw counts represent direct model predictions "
                "before tooth-wise fusion and assignment."
            )


        # ----------------------------------------------------
        # TOOTH-WISE RESULTS
        # ----------------------------------------------------

        st.markdown("---")

        st.subheader(
            "Tooth-wise Findings"
        )


        if not dataframe.empty:

            # Make a display copy so the original dataframe
            # remains unchanged.

            display_dataframe = dataframe.copy()


            # Round confidence and overlap values
            # for cleaner presentation.

            if "Tooth Confidence" in display_dataframe.columns:

                display_dataframe[
                    "Tooth Confidence"
                ] = display_dataframe[
                    "Tooth Confidence"
                ].round(3)


            if "Finding Confidence" in display_dataframe.columns:

                display_dataframe[
                    "Finding Confidence"
                ] = display_dataframe[
                    "Finding Confidence"
                ].round(3)


            if "Overlap" in display_dataframe.columns:

                display_dataframe[
                    "Overlap"
                ] = display_dataframe[
                    "Overlap"
                ].round(3)


            st.dataframe(
                display_dataframe,
                use_container_width=True,
                hide_index=True
            )


        else:

            st.info(
                "No tooth-wise findings were generated."
            )


        # ----------------------------------------------------
        # DOWNLOAD RESULTS
        # ----------------------------------------------------

        st.markdown("---")

        st.subheader(
            "Download Results"
        )


        download_col1, download_col2 = st.columns(2)


        # ----------------------------------------------------
        # CSV DOWNLOAD
        # ----------------------------------------------------

        with download_col1:

            if not dataframe.empty:

                csv_data = dataframe.to_csv(
                    index=False
                ).encode("utf-8")


                st.download_button(
                    label="⬇️ Download Tooth-wise CSV",
                    data=csv_data,
                    file_name=(
                        "perlnest_toothwise_results.csv"
                    ),
                    mime="text/csv",
                    use_container_width=True
                )

            else:

                st.button(
                    "⬇️ Download Tooth-wise CSV",
                    disabled=True,
                    use_container_width=True
                )


        # ----------------------------------------------------
        # IMAGE DOWNLOAD
        # ----------------------------------------------------

        with download_col2:

            if annotated_bgr is not None:

                success, encoded_image = cv2.imencode(
                    ".jpg",
                    annotated_bgr
                )


                if success:

                    st.download_button(
                        label="⬇️ Download Annotated X-Ray",
                        data=encoded_image.tobytes(),
                        file_name=(
                            "perlnest_annotated_xray.jpg"
                        ),
                        mime="image/jpeg",
                        use_container_width=True
                    )


        # ----------------------------------------------------
        # RESEARCH DISCLAIMER
        # ----------------------------------------------------

        st.markdown("---")

        st.warning(
            """
            **Research / Educational Prototype**

            PERLNEST is intended for research and educational
            purposes only. The predictions generated by this
            system are not a clinical diagnosis and should not
            be used as a substitute for evaluation by a
            qualified dental professional.

            The model performance metrics shown in this
            application were obtained from separate held-out
            datasets for the individual models. The
            tooth-wise fusion process has not been clinically
            validated.
            """
        )


# ============================================================
# MODEL PERFORMANCE TAB
# ============================================================

with performance_tab:

    st.header(
        "Model Performance"
    )

    st.write(
        "Performance metrics obtained from the held-out "
        "test sets of the individual models."
    )


    # --------------------------------------------------------
    # PERFORMANCE TABLE
    # --------------------------------------------------------

    performance_data = pd.DataFrame(
        [
            {
                "Model": "Model 1",
                "Task": "FDI Tooth Detection",
                "Precision": "95.4%",
                "Recall": "95.0%",
                "mAP@50": "97.9%",
                "mAP@50-95": "67.2%"
            },
            {
                "Model": "Model 2",
                "Task": "Caries Mask Segmentation",
                "Precision": "98.1%",
                "Recall": "99.4%",
                "mAP@50": "99.3%",
                "mAP@50-95": "70.5%"
            },
            {
                "Model": "Model 3",
                "Task": "Dental Findings Segmentation",
                "Precision": "73.3%",
                "Recall": "73.6%",
                "mAP@50": "75.2%",
                "mAP@50-95": "53.2%"
            }
        ]
    )


    st.dataframe(
        performance_data,
        use_container_width=True,
        hide_index=True
    )


    # --------------------------------------------------------
    # MODEL 1
    # --------------------------------------------------------

    st.markdown("---")

    st.subheader(
        "Model 1 — Tooth Detection + FDI Numbering"
    )

    st.write(
        "Detects individual teeth and assigns FDI notation "
        "from 11–48."
    )

    model1_metrics = pd.DataFrame(
        {
            "Metric": [
                "Precision",
                "Recall",
                "mAP@50",
                "mAP@50-95"
            ],
            "Value": [
                "95.4%",
                "95.0%",
                "97.9%",
                "67.2%"
            ]
        }
    )

    st.dataframe(
        model1_metrics,
        use_container_width=True,
        hide_index=True
    )

    st.caption(
        "Held-out test set: 28 images."
    )


    # --------------------------------------------------------
    # MODEL 2
    # --------------------------------------------------------

    st.markdown("---")

    st.subheader(
        "Model 2 — Caries Segmentation"
    )

    st.write(
        "Segments regions corresponding to dental caries."
    )

    model2_metrics = pd.DataFrame(
        {
            "Metric": [
                "Mask Precision",
                "Mask Recall",
                "Mask mAP@50",
                "Mask mAP@50-95"
            ],
            "Value": [
                "98.1%",
                "99.4%",
                "99.3%",
                "70.5%"
            ]
        }
    )

    st.dataframe(
        model2_metrics,
        use_container_width=True,
        hide_index=True
    )

    st.caption(
        "Held-out test set: 53 images."
    )


    # --------------------------------------------------------
    # MODEL 3
    # --------------------------------------------------------

    st.markdown("---")

    st.subheader(
        "Model 3 — Dental Findings Segmentation"
    )

    st.write(
        "Segments implants, fillings, composite fillings, "
        "amalgam fillings, and crowns."
    )

    model3_metrics = pd.DataFrame(
        {
            "Metric": [
                "Mask Precision",
                "Mask Recall",
                "Mask mAP@50",
                "Mask mAP@50-95"
            ],
            "Value": [
                "73.3%",
                "73.6%",
                "75.2%",
                "53.2%"
            ]
        }
    )

    st.dataframe(
        model3_metrics,
        use_container_width=True,
        hide_index=True
    )

    st.caption(
        "Held-out test set: 130 images."
    )


    # --------------------------------------------------------
    # PERFORMANCE WARNING
    # --------------------------------------------------------

    st.markdown("---")

    st.warning(
        """
        These metrics should not be interpreted as clinical
        diagnostic accuracy.

        Each model was evaluated independently on its
        corresponding held-out dataset. The complete
        PERLNEST pipeline and tooth-wise fusion process have
        not been clinically validated.
        """
    )


# ============================================================
# ABOUT TAB
# ============================================================

with about_tab:

    st.header(
        "About PERLNEST"
    )


    st.markdown(
        """
        ## PERLNEST

        PERLNEST is a research and educational prototype
        for analyzing panoramic dental X-ray images using
        deep-learning-based computer vision.

        The system combines three specialized models.

        ---

        ### Model 1 — Tooth Detection and FDI Numbering

        Detects individual teeth and maps them to the
        corresponding FDI numbering system.

        The model contains 32 tooth classes:

        **11–18, 21–28, 31–38, 41–48**

        ---

        ### Model 2 — Caries Segmentation

        Identifies and segments regions corresponding to
        dental caries.

        ---

        ### Model 3 — Dental Findings Segmentation

        Identifies and segments:

        - Implant
        - Filling
        - Composite filling
        - Amalgam filling
        - Crown

        ---

        ### Tooth-wise Fusion

        Predictions from the three models are combined using
        spatial overlap between detected tooth regions and
        predicted finding masks.

        A predicted finding is assigned to the tooth with the
        strongest spatial overlap when the required overlap
        condition is satisfied.

        ---

        ### Technology Stack

        - Python
        - PyTorch
        - Ultralytics YOLO
        - OpenCV
        - NumPy
        - Pandas
        - Streamlit

        ---

        ### Important Notice

        PERLNEST is an educational/research prototype.

        It is **not a clinical diagnostic system** and should
        not be used to make medical or dental treatment
        decisions.

        The reported model metrics are obtained from separate
        held-out datasets and do not represent clinical
        validation of the complete PERLNEST system.
        """
    )