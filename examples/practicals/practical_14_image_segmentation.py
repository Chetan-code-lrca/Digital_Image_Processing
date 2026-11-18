"""Practical 14: compare Otsu thresholding and K-Means segmentation."""
from examples.practicals._common import sample_gray, save
from src.dip.module5_segmentation import otsu_threshold, kmeans_segmentation
image = sample_gray()
threshold, otsu = otsu_threshold(image)
labels, clustered = kmeans_segmentation(image, clusters=3)
save("14_otsu_segmentation.png", otsu)
save("14_kmeans_segmentation.png", clustered)
print("Otsu threshold:", threshold)
print("K-Means clusters:", len(set(labels.ravel().tolist())))
