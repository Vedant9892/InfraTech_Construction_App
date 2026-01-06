import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getAllAttendanceProofs,
    getStorageStats,
    clearAllAttendanceProofs,
    initializeStorage
} from '../../lib/attendanceStorage';

export default function StorageDebugScreen() {
    const [stats, setStats] = useState<any>(null);
    const [rawData, setRawData] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            // Initialize storage first
            await initializeStorage();

            // Get stats
            const storageStats = await getStorageStats();
            setStats(storageStats);

            // Get raw data from AsyncStorage
            const data = await AsyncStorage.getItem('@attendance_records');
            setRawData(data || 'No data found');

            console.log('📊 Storage Stats:', storageStats);
            console.log('📄 Raw Data:', data);
        } catch (error) {
            console.error('Error loading stats:', error);
            Alert.alert('Error', 'Failed to load storage stats');
        } finally {
            setLoading(false);
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            'Clear All Data?',
            'This will delete all attendance records and photos. This cannot be undone!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await clearAllAttendanceProofs();
                            Alert.alert('Success', 'All data cleared');
                            loadStats();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear data');
                        }
                    },
                },
            ]
        );
    };

    const handleViewRecords = async () => {
        try {
            const records = await getAllAttendanceProofs();
            console.log('📋 All Records:', JSON.stringify(records, null, 2));
            Alert.alert(
                'Records',
                `Found ${records.length} records. Check console for details.`
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to load records');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Storage Debug</Text>
                <TouchableOpacity onPress={loadStats}>
                    <Ionicons name="refresh" size={24} color="#7C3AED" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Stats Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Storage Statistics</Text>
                    {stats ? (
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.totalRecords}</Text>
                                <Text style={styles.statLabel}>Total Records</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.pendingRecords}</Text>
                                <Text style={styles.statLabel}>Pending</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.approvedRecords}</Text>
                                <Text style={styles.statLabel}>Approved</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statValue}>{stats.unsyncedRecords}</Text>
                                <Text style={styles.statLabel}>Unsynced</Text>
                            </View>
                        </View>
                    ) : (
                        <Text style={styles.loadingText}>Loading...</Text>
                    )}
                </View>

                {/* Raw Data Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Raw AsyncStorage Data</Text>
                    <View style={styles.codeBlock}>
                        <ScrollView horizontal>
                            <Text style={styles.codeText}>{rawData}</Text>
                        </ScrollView>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>

                    <TouchableOpacity style={styles.actionButton} onPress={handleViewRecords}>
                        <Ionicons name="list-outline" size={24} color="#7C3AED" />
                        <Text style={styles.actionButtonText}>View All Records (Console)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={loadStats}>
                        <Ionicons name="refresh-outline" size={24} color="#7C3AED" />
                        <Text style={styles.actionButtonText}>Refresh Stats</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton]}
                        onPress={handleClearAll}
                    >
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        <Text style={[styles.actionButtonText, styles.dangerText]}>Clear All Data</Text>
                    </TouchableOpacity>
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={24} color="#7C3AED" />
                    <Text style={styles.infoText}>
                        This screen helps debug local storage. Check the console logs for detailed information.
                    </Text>
                </View>
            </ScrollView>
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
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#7C3AED',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    loadingText: {
        color: '#6B7280',
        fontStyle: 'italic',
    },
    codeBlock: {
        backgroundColor: '#1F2937',
        padding: 16,
        borderRadius: 8,
        maxHeight: 200,
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#10B981',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
    },
    dangerButton: {
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    dangerText: {
        color: '#EF4444',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginTop: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
});
