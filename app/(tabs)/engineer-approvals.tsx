import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PendingAttendance {
    id: string;
    labourName: string;
    labourId: string;
    photoUri: string;
    location: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function EngineerApprovalScreen() {
    const [selectedRecord, setSelectedRecord] = useState<PendingAttendance | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Mock data - replace with actual API call
    const [pendingAttendances, setPendingAttendances] = useState<PendingAttendance[]>([
        {
            id: '1',
            labourName: 'Chetan',
            labourId: 'LAB001',
            photoUri: 'https://via.placeholder.com/400x500',
            location: {
                latitude: 28.6139,
                longitude: 77.2090,
                address: 'Construction Site, Sector 62, Noida',
            },
            timestamp: new Date().toISOString(),
            status: 'pending',
        },
        {
            id: '2',
            labourName: 'Amit Singh',
            labourId: 'LAB002',
            photoUri: 'https://via.placeholder.com/400x500',
            location: {
                latitude: 28.6140,
                longitude: 77.2091,
                address: 'Construction Site, Sector 62, Noida',
            },
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'pending',
        },
    ]);

    const handleApprove = async (recordId: string) => {
        try {
            // Here you would call your API to approve the attendance
            setPendingAttendances(prev =>
                prev.map(record =>
                    record.id === recordId ? { ...record, status: 'approved' as const } : record
                )
            );

            setShowDetailModal(false);
            Alert.alert('Success', 'Attendance approved successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to approve attendance');
        }
    };

    const handleReject = async (recordId: string) => {
        try {
            // Here you would call your API to reject the attendance
            setPendingAttendances(prev =>
                prev.map(record =>
                    record.id === recordId ? { ...record, status: 'rejected' as const } : record
                )
            );

            setShowDetailModal(false);
            Alert.alert('Success', 'Attendance rejected');
        } catch (error) {
            Alert.alert('Error', 'Failed to reject attendance');
        }
    };

    const openDetailModal = (record: PendingAttendance) => {
        setSelectedRecord(record);
        setShowDetailModal(true);
    };

    const pendingCount = pendingAttendances.filter(a => a.status === 'pending').length;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Attendance Approvals</Text>
                <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{pendingCount} Pending</Text>
                </View>
            </View>

            {/* Pending Attendances List */}
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {pendingAttendances.filter(a => a.status === 'pending').length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyStateText}>All caught up!</Text>
                        <Text style={styles.emptyStateSubtext}>No pending attendance approvals</Text>
                    </View>
                ) : (
                    pendingAttendances
                        .filter(a => a.status === 'pending')
                        .map((record) => (
                            <TouchableOpacity
                                key={record.id}
                                style={styles.attendanceCard}
                                onPress={() => openDetailModal(record)}
                            >
                                <Image source={{ uri: record.photoUri }} style={styles.thumbnail} />

                                <View style={styles.cardContent}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.labourName}>{record.labourName}</Text>
                                        <Text style={styles.labourId}>{record.labourId}</Text>
                                    </View>

                                    <View style={styles.cardDetails}>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="time-outline" size={16} color="#6B7280" />
                                            <Text style={styles.detailText}>
                                                {new Date(record.timestamp).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="location-outline" size={16} color="#6B7280" />
                                            <Text style={styles.detailText} numberOfLines={1}>
                                                {record.location.address}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardActions}>
                                        <TouchableOpacity
                                            style={styles.rejectButton}
                                            onPress={() => handleReject(record.id)}
                                        >
                                            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                                            <Text style={styles.rejectButtonText}>Reject</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.approveButton}
                                            onPress={() => handleApprove(record.id)}
                                        >
                                            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                                            <Text style={styles.approveButtonText}>Approve</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))
                )}
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDetailModal(false)}
            >
                {selectedRecord && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Ionicons name="close" size={28} color="#1F2937" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Attendance Details</Text>
                            <View style={{ width: 28 }} />
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <Image source={{ uri: selectedRecord.photoUri }} style={styles.fullImage} />

                            <View style={styles.detailsSection}>
                                <View style={styles.detailCard}>
                                    <Ionicons name="person-outline" size={24} color="#7C3AED" />
                                    <View style={styles.detailCardContent}>
                                        <Text style={styles.detailCardLabel}>Labour Name</Text>
                                        <Text style={styles.detailCardValue}>{selectedRecord.labourName}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailCard}>
                                    <Ionicons name="card-outline" size={24} color="#7C3AED" />
                                    <View style={styles.detailCardContent}>
                                        <Text style={styles.detailCardLabel}>Labour ID</Text>
                                        <Text style={styles.detailCardValue}>{selectedRecord.labourId}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailCard}>
                                    <Ionicons name="time-outline" size={24} color="#7C3AED" />
                                    <View style={styles.detailCardContent}>
                                        <Text style={styles.detailCardLabel}>Date & Time</Text>
                                        <Text style={styles.detailCardValue}>
                                            {new Date(selectedRecord.timestamp).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailCard}>
                                    <Ionicons name="location-outline" size={24} color="#7C3AED" />
                                    <View style={styles.detailCardContent}>
                                        <Text style={styles.detailCardLabel}>Location</Text>
                                        <Text style={styles.detailCardValue}>{selectedRecord.location.address}</Text>
                                        <Text style={styles.detailCardSubvalue}>
                                            {selectedRecord.location.latitude.toFixed(6)}, {selectedRecord.location.longitude.toFixed(6)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalRejectButton}
                                onPress={() => handleReject(selectedRecord.id)}
                            >
                                <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                                <Text style={styles.modalRejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalApproveButton}
                                onPress={() => handleApprove(selectedRecord.id)}
                            >
                                <Ionicons name="checkmark-circle-outline" size={24} color="#FFF" />
                                <Text style={styles.modalApproveButtonText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>
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
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    pendingBadgeText: {
        color: '#D97706',
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        flex: 1,
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
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
    attendanceCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    thumbnail: {
        width: 80,
        height: 100,
        borderRadius: 12,
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        marginBottom: 8,
    },
    labourName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    labourId: {
        fontSize: 12,
        color: '#6B7280',
    },
    cardDetails: {
        marginBottom: 12,
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 8,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    rejectButtonText: {
        color: '#EF4444',
        fontSize: 14,
        fontWeight: '600',
    },
    approveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7C3AED',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 4,
    },
    approveButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    modalContent: {
        flex: 1,
    },
    fullImage: {
        width: '100%',
        height: 400,
        resizeMode: 'cover',
    },
    detailsSection: {
        padding: 20,
    },
    detailCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    detailCardContent: {
        marginLeft: 12,
        flex: 1,
    },
    detailCardLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    detailCardValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },
    detailCardSubvalue: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    modalRejectButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE2E2',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    modalRejectButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    modalApproveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7C3AED',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    modalApproveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
