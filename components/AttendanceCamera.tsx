import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface AttendancePhoto {
  uri: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
}

interface AttendanceCameraProps {
  onPhotoTaken: (photo: AttendancePhoto) => void;
  onCancel: () => void;
}

export default function AttendanceCamera({ onPhotoTaken, onCancel }: AttendanceCameraProps) {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<AttendancePhoto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === 'granted');
  };

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#7C3AED" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#7C3AED" />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Get address from coordinates
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address[0] ? `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}` : undefined,
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsLoading(true);

    try {
      // Check location permission
      if (!locationPermission) {
        Alert.alert('Location Required', 'Please enable location to mark attendance');
        setIsLoading(false);
        return;
      }

      // Get current location
      const location = await getCurrentLocation();

      // Take photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        const attendancePhoto: AttendancePhoto = {
          uri: photo.uri,
          location,
          timestamp: new Date().toISOString(),
        };

        setCapturedPhoto(attendancePhoto);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
      console.error('Error taking picture:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (capturedPhoto) {
      onPhotoTaken(capturedPhoto);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto.uri }} style={styles.preview} />
          
          <View style={styles.metadataContainer}>
            <View style={styles.metadataCard}>
              <Ionicons name="time-outline" size={20} color="#7C3AED" />
              <View style={styles.metadataText}>
                <Text style={styles.metadataLabel}>Time</Text>
                <Text style={styles.metadataValue}>
                  {new Date(capturedPhoto.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.metadataCard}>
              <Ionicons name="location-outline" size={20} color="#7C3AED" />
              <View style={styles.metadataText}>
                <Text style={styles.metadataLabel}>Location</Text>
                <Text style={styles.metadataValue}>
                  {capturedPhoto.location.address || 
                   `${capturedPhoto.location.latitude.toFixed(6)}, ${capturedPhoto.location.longitude.toFixed(6)}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Ionicons name="refresh-outline" size={24} color="#7C3AED" />
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
              <Text style={styles.submitButtonText}>Submit Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Mark Attendance</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.overlay}>
          <View style={styles.faceGuide} />
          <Text style={styles.guideText}>Position your face in the frame</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
          >
            <Ionicons name="camera-reverse-outline" size={32} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={{ width: 60 }} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  headerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 250,
    height: 300,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
  },
  guideText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  preview: {
    width: '100%',
    height: '50%',
    resizeMode: 'cover',
  },
  metadataContainer: {
    padding: 20,
  },
  metadataCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  metadataText: {
    marginLeft: 12,
    flex: 1,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
