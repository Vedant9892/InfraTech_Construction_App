import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AttendanceCamera from '../../components/AttendanceCamera';

interface AttendanceRecord {
    id: string;
    photoUri: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function LabourAttendanceScreen() {
    const [showCamera, setShowCamera] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePhotoTaken = async (photo: any) => {
        setIsSubmitting(true);

        try {
            // Here you would upload the photo to your backend
            // For now, we'll simulate the API call
            const newRecord: AttendanceRecord = {
                id: Date.now().toString(),
                photoUri: photo.uri,
                location: photo.location,
                timestamp: photo.timestamp,
                status: 'pending',
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            setAttendanceHistory(prev => [newRecord, ...prev]);
            setShowCamera(false);

            Alert.alert(
                'Success',
                'Attendance marked successfully! Waiting for engineer approval.',
                [{ text: 'OK' }]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to submit attendance. Please try again.');
            console.error('Error submitting attendance:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setShowCamera(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return '#10B981';
            case 'rejected':
                return '#EF4444';
            default:
                return '#F59E0B';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return 'checkmark-circle';
            case 'rejected':
                return 'close-circle';
            default:
                return 'time';
        }
    };

    if (showCamera) {
        return <AttendanceCamera onPhotoTaken={handlePhotoTaken} onCancel={handleCancel} />;
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Attendance</Text>
                <Text style={styles.headerSubtitle}>Mark your daily attendance with photo proof</Text>
            </View>

            {/* Mark Attendance Button */}
            <TouchableOpacity style={styles.markButton} onPress={() => setShowCamera(true)}>
                <View style={styles.markButtonContent}>
                    <View style={styles.markButtonIcon}>
                        <Ionicons name="camera" size={32} color="#FFF" />
                    </View>
                    <View style={styles.markButtonText}>
                        <Text style={styles.markButtonTitle}>Mark Attendance</Text>
                        <Text style={styles.markButtonSubtitle}>Take a photo to mark your attendance</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#7C3AED" />
                </View>
            </TouchableOpacity>

            {/* Attendance History */}
            <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Attendance History</Text>

                <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                    {attendanceHistory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyStateText}>No attendance records yet</Text>
                            <Text style={styles.emptyStateSubtext}>Mark your first attendance to get started</Text>
                        </View>
                    ) : (
                        attendanceHistory.map((record) => (
                            <View key={record.id} style={styles.recordCard}>
                                <Image source={{ uri: record.photoUri }} style={styles.recordPhoto} />

                                <View style={styles.recordContent}>
                                    <View style={styles.recordHeader}>
                                        <Text style={styles.recordDate}>
                                            {new Date(record.timestamp).toLocaleDateString()}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) + '20' }]}>
                                            <Ionicons
                                                name={getStatusIcon(record.status) as any}
                                                size={16}
                                                color={getStatusColor(record.status)}
                                            />
                                            <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.recordDetails}>
                                        <View style={styles.recordDetail}>
                                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                                            <Text style={styles.recordDetailText}>
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </Text>
                                        </View>
                                        <View style={styles.recordDetail}>
                                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                                            <Text style={styles.recordDetailText} numberOfLines={1}>
                                                {record.location.address ||
                                                    `${record.location.latitude.toFixed(4)}, ${record.location.longitude.toFixed(4)}`}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#FFF',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    markButton: {
        margin: 20,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    markButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    markButtonIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    markButtonText: {
        flex: 1,
    },
    markButtonTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    markButtonSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    historySection: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    historyList: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
    recordCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    recordPhoto: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    recordContent: {
        padding: 16,
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recordDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    recordDetails: {
        gap: 8,
    },
    recordDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    recordDetailText: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
});
