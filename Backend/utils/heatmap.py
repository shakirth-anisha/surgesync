import cv2
import numpy as np

class HeatmapGenerator:
    def __init__(self, frame_shape, decay_factor=0.95):
        """
        Initialize the HeatmapGenerator.

        Args:
            frame_shape (tuple): Shape of the frame (height, width).
            decay_factor (float): Decay factor for the heatmap over time (0 < decay_factor < 1).
        """
        self.frame_shape = frame_shape
        self.decay_factor = decay_factor
        self.heatmap = np.zeros(frame_shape, dtype=np.float32)

    def update(self, positions):
        """
        Update the heatmap with new positions of detected people.

        Args:
            positions (list): List of (x, y) positions of detected people.
        """
        # Decay the existing heatmap
        self.heatmap *= self.decay_factor

        # Create a new density map based on the current positions
        density_map = np.zeros(self.frame_shape, dtype=np.float32)
        for (x, y) in positions:
            # Add a Gaussian blob at each position
            cv2.circle(density_map, (x, y), 20, 1, -1)

        # Add the new density map to the heatmap
        self.heatmap += density_map

    def get_heatmap(self, num_people, max_threshold):
        """
        Get the current heatmap as a color-mapped image with UI elements.

        Args:
            num_people (int): Number of people detected in the frame.
            max_threshold (int): Maximum threshold for crowd alert.

        Returns:
            heatmap_colored (numpy.ndarray): Color-mapped heatmap with UI elements.
        """
        # Normalize the heatmap to the range [0, 1]
        heatmap_normalized = cv2.normalize(self.heatmap, None, 0, 1, cv2.NORM_MINMAX)

        # Apply a color map to the normalized heatmap
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_normalized), cv2.COLORMAP_JET)

        # Add UI elements (People Count and Max Threshold) to the heatmap
        cv2.putText(heatmap_colored, f"Predicted People: {num_people}", (10, 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 166, 33), 2)
        cv2.putText(heatmap_colored, f"Max Threshold: {max_threshold}", (10, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (38, 149, 116), 2)

        return heatmap_colored

    def reset(self):
        """
        Reset the heatmap to zero.
        """
        self.heatmap = np.zeros(self.frame_shape, dtype=np.float32)