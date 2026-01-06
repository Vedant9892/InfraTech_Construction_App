import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const ATTENDANCE_STORAGE_KEY = '@attendance_records';
const PHOTOS_DIR = `${FileSystem.documentDirectory}attendance_photos/`;

export interface AttendanceProof {
    id: string;
    labourId: string;
    labourName: string;
    photoUri: string;
    localPhotoPath: string; // Permanent local storage path
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    timestamp: string;
    markedAt: string; // When the "Mark Present" button was clicked
    status: 'pending' | 'approved' | 'rejected' | 'syncing';
    syncedToServer: boolean;
    metadata: {
        deviceInfo?: string;
        appVersion?: string;
    };
}

/**
 * Initialize the photos directory
 */
export const initializeStorage = async () => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
        }
    } catch (error) {
        console.error('Error initializing storage:', error);
    }
};

/**
 * Save photo to permanent local storage
 */
const savePhotoLocally = async (photoUri: string, attendanceId: string): Promise<string> => {
    try {
        await initializeStorage();
        const fileName = `${attendanceId}_${Date.now()}.jpg`;
        const localPath = `${PHOTOS_DIR}${fileName}`;

        // Copy photo to permanent storage
        await FileSystem.copyAsync({
            from: photoUri,
            to: localPath,
        });

        return localPath;
    } catch (error) {
        console.error('Error saving photo locally:', error);
        throw error;
    }
};

/**
 * Save attendance record with proof to local storage
 */
export const saveAttendanceProof = async (
    attendanceData: Omit<AttendanceProof, 'id' | 'localPhotoPath' | 'markedAt' | 'syncedToServer' | 'metadata'>
): Promise<AttendanceProof> => {
    try {
        const attendanceId = `ATT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Save photo to permanent local storage
        const localPhotoPath = await savePhotoLocally(attendanceData.photoUri, attendanceId);

        // Create complete attendance record
        const attendanceProof: AttendanceProof = {
            ...attendanceData,
            id: attendanceId,
            localPhotoPath,
            markedAt: new Date().toISOString(),
            syncedToServer: false,
            metadata: {
                appVersion: '1.0.0',
            },
        };

        // Get existing records
        const existingRecords = await getAllAttendanceProofs();

        // Add new record
        const updatedRecords = [attendanceProof, ...existingRecords];

        // Save to AsyncStorage
        await AsyncStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedRecords));

        console.log('✅ Attendance proof saved locally:', attendanceId);
        return attendanceProof;
    } catch (error) {
        console.error('Error saving attendance proof:', error);
        throw error;
    }
};

/**
 * Get all attendance proofs from local storage
 */
export const getAllAttendanceProofs = async (): Promise<AttendanceProof[]> => {
    try {
        const data = await AsyncStorage.getItem(ATTENDANCE_STORAGE_KEY);
        if (!data) return [];

        const records: AttendanceProof[] = JSON.parse(data);
        return records;
    } catch (error) {
        console.error('Error getting attendance proofs:', error);
        return [];
    }
};

/**
 * Get attendance proofs for a specific labour
 */
export const getLabourAttendanceProofs = async (labourId: string): Promise<AttendanceProof[]> => {
    try {
        const allRecords = await getAllAttendanceProofs();
        return allRecords.filter(record => record.labourId === labourId);
    } catch (error) {
        console.error('Error getting labour attendance proofs:', error);
        return [];
    }
};

/**
 * Update attendance record status
 */
export const updateAttendanceStatus = async (
    attendanceId: string,
    status: AttendanceProof['status'],
    syncedToServer: boolean = false
): Promise<void> => {
    try {
        const records = await getAllAttendanceProofs();
        const updatedRecords = records.map(record =>
            record.id === attendanceId
                ? { ...record, status, syncedToServer }
                : record
        );

        await AsyncStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedRecords));
        console.log('✅ Attendance status updated:', attendanceId, status);
    } catch (error) {
        console.error('Error updating attendance status:', error);
        throw error;
    }
};

/**
 * Get unsynced attendance records
 */
export const getUnsyncedAttendance = async (): Promise<AttendanceProof[]> => {
    try {
        const allRecords = await getAllAttendanceProofs();
        return allRecords.filter(record => !record.syncedToServer);
    } catch (error) {
        console.error('Error getting unsynced attendance:', error);
        return [];
    }
};

/**
 * Delete attendance proof (including photo)
 */
export const deleteAttendanceProof = async (attendanceId: string): Promise<void> => {
    try {
        const records = await getAllAttendanceProofs();
        const recordToDelete = records.find(r => r.id === attendanceId);

        if (recordToDelete) {
            // Delete photo file
            const fileInfo = await FileSystem.getInfoAsync(recordToDelete.localPhotoPath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(recordToDelete.localPhotoPath);
            }
        }

        // Remove from storage
        const updatedRecords = records.filter(record => record.id !== attendanceId);
        await AsyncStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(updatedRecords));

        console.log('✅ Attendance proof deleted:', attendanceId);
    } catch (error) {
        console.error('Error deleting attendance proof:', error);
        throw error;
    }
};

/**
 * Clear all attendance proofs (use with caution)
 */
export const clearAllAttendanceProofs = async (): Promise<void> => {
    try {
        // Delete all photos
        const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(PHOTOS_DIR, { idempotent: true });
        }

        // Clear AsyncStorage
        await AsyncStorage.removeItem(ATTENDANCE_STORAGE_KEY);

        console.log('✅ All attendance proofs cleared');
    } catch (error) {
        console.error('Error clearing attendance proofs:', error);
        throw error;
    }
};

/**
 * Get storage statistics
 */
export const getStorageStats = async () => {
    try {
        const records = await getAllAttendanceProofs();
        const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);

        return {
            totalRecords: records.length,
            pendingRecords: records.filter(r => r.status === 'pending').length,
            approvedRecords: records.filter(r => r.status === 'approved').length,
            rejectedRecords: records.filter(r => r.status === 'rejected').length,
            unsyncedRecords: records.filter(r => !r.syncedToServer).length,
            storageExists: dirInfo.exists,
        };
    } catch (error) {
        console.error('Error getting storage stats:', error);
        return null;
    }
};
