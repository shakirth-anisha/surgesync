import os
import platform
from tracker.centroidtracker import CentroidTracker
from tracker.trackableobject import TrackableObject
from imutils.video import VideoStream
from itertools import zip_longest
from imutils.video import FPS
from utils import thread
import numpy as np
import threading
import argparse
import datetime
import schedule
import logging
import imutils
import time
import dlib
import json
import csv
import cv2
import pyautogui
from utils.thingy import Duck
from utils.heatmap import HeatmapGenerator  # Import the HeatmapGenerator

# Execution start time
start_time = time.time()

# Setup logger
logging.basicConfig(level=logging.INFO, format="[INFO] %(message)s")
logger = logging.getLogger(__name__)

with open("utils/config.json", "r") as file:
    config = json.load(file)

# Cooldown period in seconds (e.g., 60 seconds)
COOLDOWN_PERIOD = 2

# Track the last time send_info was called
last_send_time = 0

# College-specific data
PLACE_DATA = {
    "KSIT": {
        "name": "KSIT",
        "address": "14, Kanakapura Main Rd, Raghuvanahalli, Bangalore City Municipal Corporation Layout, Bengaluru, Karnataka 560109",
        "link": "https://maps.app.goo.gl/anbAKdGzuY9DqRr3A",
        "lat": 12.879957,
        "long": 77.544522
    },
    "PES-ECC": {
        "name": "PES ECC",
        "address": "VM67+HVP, Hosur Rd, Konappana Agrahara, Electronic City, Bengaluru, Karnataka 560100",
        "link": "https://maps.app.goo.gl/TgBopdtHaV1czH8e9",
        "lat": 12.86147289952204,
        "long": 77.66467133123813
    },
    "PES-RR": {
        "name": "PES RR",
        "address": "100 Feet Ring Road, Banashankari Stage III, Dwaraka Nagar, Banashankari, Bengaluru, Karnataka 560085",
        "link": "https://maps.app.goo.gl/fXvG54xaCagHA1r86",
        "lat": 12.935186253198177,
        "long": 77.536051424145
    },
    
}

def parse_arguments():
    # Function to parse the arguments
    ap = argparse.ArgumentParser()
    ap.add_argument("-p", "--prototxt", required=False,
                    help="path to Caffe 'deploy' prototxt file")
    ap.add_argument("-m", "--model", required=True,
                    help="path to Caffe pre-trained model")
    ap.add_argument("-i", "--input", type=str,
                    help="path to optional input video file")
    ap.add_argument("-o", "--output", type=str,
                    help="path to optional output video file")
    ap.add_argument("-c", "--confidence", type=float, default=0.4,
                    help="minimum probability to filter weak detections")
    ap.add_argument("-s", "--skip-frames", type=int, default=30,
                    help="# of skip frames between detections")
    ap.add_argument("-n", "--place-name", type=str, required=True,
                    help="name of the college (e.g., KSIT, PES ECC, PES RR)")
    args = vars(ap.parse_args())
    return args

def log_data(count, time):
    # Function to log the counting data
    data = [count, time]
    # Transpose the data to align the columns properly
    export_data = zip_longest(*data, fillvalue='')

    with open('utils/data/logs/counting_data.csv', 'w', newline='') as myfile:
        wr = csv.writer(myfile, quoting=csv.QUOTE_ALL)
        if myfile.tell() == 0:  # Check if header rows are already existing
            wr.writerow(("Count", "Time"))
        wr.writerows(export_data)

def duck_api_call(duck, action, name, address, link, lat, long):
    """Helper function to call Duck API in a separate thread."""
    if action == "send":
        status_code, response = duck.send_info(name=name, address=address, link=link, latitude=lat, longitude=long)
        if status_code == 200:
            logger.info("Crowd alert information sent to Duck API.")
    elif action == "remove":
        status_code, response = duck.remove_info(name=name, address=address, link=link, latitude=lat, longitude=long)
        if status_code == 200:
            logger.info("Crowd alert information removed from Duck API.")

def people_counter():
    global last_send_time

    # Main function for people_counter.py
    args = parse_arguments()

    # Fetch college-specific data
    place_name = args["place_name"]
    if place_name not in PLACE_DATA:
        logger.error(f"College '{place_name}' not found in the data.")
        return

    college_info = PLACE_DATA[place_name]

    # Initialize the list of class labels MobileNet SSD was trained to detect
    CLASSES = ["background", "aeroplane", "bicycle", "bird", "boat",
               "bottle", "bus", "car", "cat", "chair", "cow", "diningtable",
               "dog", "horse", "motorbike", "person", "pottedplant", "sheep",
               "sofa", "train", "tvmonitor"]

    # Load our serialized model from disk
    net = cv2.dnn.readNetFromCaffe(args["prototxt"], args["model"])

    # If a video path was not supplied, grab a reference to the IP camera
    if not args.get("input", False):
        logger.info("Starting the live stream..")
        vs = VideoStream(config["url"]).start()
        time.sleep(2.0)

    # Otherwise, grab a reference to the video file
    else:
        logger.info("Starting the video..")
        vs = cv2.VideoCapture(args["input"])

    # Initialize the video writer (we'll instantiate later if need be)
    writer = None

    # Initialize the frame dimensions (we'll set them as soon as we read the first frame from the video)
    W = None
    H = None

    # Instantiate our centroid tracker, then initialize a list to store each of our dlib correlation trackers
    ct = CentroidTracker(maxDisappeared=40, maxDistance=50)
    trackers = []
    trackableObjects = {}

    # Initialize the total number of frames processed thus far
    totalFrames = 0

    # Start the frames per second throughput estimator
    fps = FPS().start()

    if config["Thread"]:
        vs = thread.ThreadingClass(config["url"])

    # Get screen dimensions using pyautogui
    screen_width, screen_height = pyautogui.size()
    window_width = int(screen_width * 0.9)  # 90% of screen width
    window_height = int(screen_height * 0.8)  # 90% of screen height

    # Initialize the Duck class
    duck = Duck()

    # Initialize the HeatmapGenerator
    heatmap_generator = None

    # Loop over frames from the video stream
    while True:
        # Grab the next frame and handle if we are reading from either VideoCapture or VideoStream
        frame = vs.read()
        frame = frame[1] if args.get("input", False) else frame

        # If we are viewing a video and we did not grab a frame, then we have reached the end of the video
        if args["input"] is not None and frame is None:
            break

        # Resize the frame to have a maximum width of 500 pixels
        frame = imutils.resize(frame, width=500)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # If the frame dimensions are empty, set them
        if W is None or H is None:
            (H, W) = frame.shape[:2]
            heatmap_generator = HeatmapGenerator(frame_shape=(H, W))  # Initialize heatmap generator

        # If we are supposed to be writing a video to disk, initialize the writer
        if args["output"] is not None and writer is None:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(args["output"], fourcc, 30, (W, H), True)

        # Initialize the current status along with our list of bounding box rectangles
        status = "Waiting"
        rects = []

        # Check to see if we should run object detection
        if totalFrames % args["skip_frames"] == 0:
            status = "Detecting"
            trackers = []

            # Convert the frame to a blob and pass it through the network
            blob = cv2.dnn.blobFromImage(frame, 0.007843, (W, H), 127.5)
            net.setInput(blob)
            detections = net.forward()

            # Loop over the detections
            for i in np.arange(0, detections.shape[2]):
                confidence = detections[0, 0, i, 2]

                if confidence > args["confidence"]:
                    idx = int(detections[0, 0, i, 1])

                    if CLASSES[idx] != "person":
                        continue

                    box = detections[0, 0, i, 3:7] * np.array([W, H, W, H])
                    (startX, startY, endX, endY) = box.astype("int")

                    tracker = dlib.correlation_tracker()
                    rect = dlib.rectangle(startX, startY, endX, endY)
                    tracker.start_track(rgb, rect)
                    trackers.append(tracker)

        else:
            # Loop over the trackers
            for tracker in trackers:
                status = "Tracking"
                tracker.update(rgb)
                pos = tracker.get_position()

                startX = int(pos.left())
                startY = int(pos.top())
                endX = int(pos.right())
                endY = int(pos.bottom())

                # Draw a green bounding box around the detected person
                cv2.rectangle(frame, (startX, startY), (endX, endY), (38, 149, 116), 2)

                # Add the bounding box coordinates to the rectangles list
                rects.append((startX, startY, endX, endY))

        # Use the centroid tracker to associate old object centroids with new ones
        objects = ct.update(rects)

        # Count the number of people in the frame
        num_people = len(objects)

        # Draw the number of people on the frame
        cv2.putText(frame, f"People: {num_people}", (10, 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 166, 33), 2)
        cv2.putText(frame, f"Max Threshold: {config['Threshold']}", (10, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (38, 149, 116), 2)

        # If the people limit exceeds the threshold, send an alert
        if num_people >= config["Threshold"]:
            cv2.putText(frame, "Crowd Accumulating!", (10, frame.shape[0] - 80),
                        cv2.FONT_HERSHEY_COMPLEX, 0.5, (0, 0, 255), 2)

            # Check if cooldown period has passed
            current_time = time.time()
            if current_time - last_send_time >= COOLDOWN_PERIOD:
                # Send information to the Duck API in a separate thread
                duck_thread = threading.Thread(
                    target=duck_api_call,
                    args=(duck, "send", college_info["name"], college_info["address"], college_info["link"], college_info["lat"], college_info["long"])
                )
                duck_thread.daemon = True
                duck_thread.start()

                # Update the last send time
                last_send_time = current_time
        else:
            # Remove information from the Duck API in a separate thread
            duck_thread = threading.Thread(
                target=duck_api_call,
                args=(duck, "remove", college_info["name"], college_info["address"], college_info["link"], college_info["lat"], college_info["long"])
            )
            duck_thread.daemon = True
            duck_thread.start()

        # Log the counting data
        if config["Log"]:
            date_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            log_thread = threading.Thread(target=log_data, args=([num_people], [date_time]))
            log_thread.daemon = True
            log_thread.start()

        # Update the heatmap with the positions of detected people
        positions = [(int((startX + endX) / 2), int((startY + endY) / 2)) for (startX, startY, endX, endY) in rects]
        heatmap_generator.update(positions)

        # Get the heatmap with UI elements
        heatmap_colored = heatmap_generator.get_heatmap(num_people=num_people, max_threshold=config["Threshold"])

        # Create the heatmap window with the specified size
        cv2.namedWindow("Heatmap", cv2.WINDOW_NORMAL)
        cv2.resizeWindow("Heatmap", window_width, window_height)

        # Display the heatmap
        cv2.imshow("Heatmap", heatmap_colored)

        # Check for key press
        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break

        # Increment the total number of frames processed thus far and update the FPS counter
        totalFrames += 1
        fps.update()

        # Initiate the timer
        if config["Timer"]:
            end_time = time.time()
            num_seconds = (end_time - start_time)
            if num_seconds >= 28800:  # 8 hours
                logger.info("Stopping the live stream after 8 hours..")
                break
            time.sleep(config["Duration"])

    # Stop the FPS counter and display FPS information
    fps.stop()
    logger.info("[INFO] elapsed time: {:.2f}".format(fps.elapsed()))
    logger.info("[INFO] approx. FPS: {:.2f}".format(fps.fps()))

    # Release the video writer and video stream pointers
    if writer is not None:
        writer.release()
    if not args.get("input", False):
        vs.stop()
    else:
        vs.release()

    # Close all open windows
    cv2.destroyAllWindows()

if __name__ == "__main__":
    people_counter()