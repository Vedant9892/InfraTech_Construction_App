import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  time: string;
  location: string;
  supervisor: string;
  supervisorAvatar: string;
};

type AttendanceRecord = {
  id: string;
  userId: string;
  timestamp: Date;
  photoUri: string;
  latitude: number;
  longitude: number;
  status: 'present' | 'absent';
};

type GPSCheckRecord = {
  timestamp: Date;
  latitude: number;
  longitude: number;
};

const { width } = Dimensions.get('window');

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Foundation Inspection',
    time: '09:00 AM',
    location: 'Site A, Pune',
    status: 'pending',
    supervisor: 'Ramesh Patil',
    supervisorAvatar: '👨‍💼',
  },
  {
    id: '2',
    title: 'Material Check',
    time: '11:30 AM',
    location: 'Warehouse, Thane',
    status: 'pending',
    supervisor: 'Anjali Sharma',
    supervisorAvatar: '👩‍💼',
  },
  {
    id: '3',
    title: 'Steel Framework',
    time: '02:00 PM',
    location: 'Site B, Mumbai',
    status: 'completed',
    supervisor: 'Suresh Yadav',
    supervisorAvatar: '👨‍🔧',
  },
];

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState(mockTasks);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, requestLocationPermission] = Location.useForegroundPermissions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [gpsCheckInterval, setGpsCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<any>(null); // Using 'any' to ensure compatibility
  const { t } = useLanguage();
  const { user } = useUser();
  const router = useRouter();

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 3));

  // Debug: Track showCamera state changes
  useEffect(() => {
    console.log('showCamera state changed:', showCamera);
  }, [showCamera]);

  // GPS tracking every 2 hours
  useEffect(() => {
    if (user?.role === 'labour' && attendanceRecords.some(r => r.status === 'present' && format(r.timestamp, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))) {
      startGPSTracking();
    }
    return () => {
      if (gpsCheckInterval) clearInterval(gpsCheckInterval);
    };
  }, [attendanceRecords]);

  const startGPSTracking = async () => {
    // Check GPS every 2 hours (7200000 ms)
    const interval = setInterval(async () => {
      const location = await Location.getCurrentPositionAsync({});
      const record: GPSCheckRecord = {
        timestamp: new Date(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      console.log('GPS Check:', record);
      // In production, send to database
      Alert.alert('GPS Check', 'Location verified for attendance tracking');
    }, 7200000); // 2 hours

    setGpsCheckInterval(interval);
  };

  const requestPermissions = async () => {
    const locStatus = await requestLocationPermission();
    const camStatus = await requestCameraPermission();
    
    if (!locStatus?.granted) {
      Alert.alert('Permission Required', 'Location permission is required for attendance');
      return false;
    }
    if (!camStatus?.granted) {
      Alert.alert('Permission Required', 'Camera permission is required for live photo');
      return false;
    }
    return true;
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      return location;
    } catch (error) {
      Alert.alert('Error', 'Unable to get location');
      return null;
    }
  };

  const handleOpenAttendance = async () => {
    const hasPermissions = await requestPermissions();
    if (hasPermissions) {
      await getCurrentLocation();
      setShowAttendanceModal(true);
    }
  };

  const handleOpenCamera = async () => {
    console.log('handleOpenCamera called');
    console.log('Current camera permission:', cameraPermission);
    
    if (!cameraPermission?.granted) {
      console.log('Requesting camera permission...');
      const result = await requestCameraPermission();
      console.log('Permission result:', result);
      
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is required to take a live photo');
        return;
      }
    }
    
    console.log('Opening camera modal...');
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    console.log('handleTakePhoto called');
    console.log('Camera ref:', cameraRef.current);
    
    if (!cameraRef.current) {
      console.error('Camera ref is null');
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    try {
      console.log('Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      console.log('Photo captured:', photo);

      if (photo && photo.uri) {
        console.log('Photo URI:', photo.uri);
        setCapturedPhoto(photo.uri);
        setShowCamera(false);
      } else {
        console.error('No photo URI returned');
        Alert.alert('Error', 'Failed to capture photo');
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };  const handleMarkPresent = async () => {
    if (!capturedPhoto) {
      Alert.alert('Photo Required', 'Please capture a live photo');
      return;
    }
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location');
      return;
    }

    const record: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user?.name || 'User',
      timestamp: new Date(),
      photoUri: capturedPhoto,
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      status: 'present',
    };

    setAttendanceRecords([...attendanceRecords, record]);
    Alert.alert(
      'Attendance Marked!',
      `You are marked present at ${format(new Date(), 'hh:mm a')}.\n\nGPS tracking enabled: Your location will be verified every 2 hours to ensure on-site presence.`,
      [{ text: 'OK', onPress: () => {
        setShowAttendanceModal(false);
        setCapturedPhoto(null);
      }}]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  // Role-specific features based on flowchart
  const getRoleName = () => {
    if (!user) return 'User';
    return user.name;
  };

  const getRoleFeatures = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'labour':
        return [
          { id: 'attendance', icon: 'location', title: 'Mark Attendance', subtitle: 'GPS + Photo Required', color: '#8B5CF6' },
          { id: 'tasks', icon: 'clipboard', title: 'My Assigned Tasks', subtitle: 'View daily work', color: '#10B981' },
          { id: 'site-docs', icon: 'camera', title: 'Site Documentation', subtitle: 'Upload work photos', color: '#F59E0B' },
          { id: 'chat', icon: 'chatbubbles', title: 'Chat with Supervisor', subtitle: 'Report & communicate', color: '#3B82F6' },
        ];
      case 'supervisor':
        return [
          { id: 'verify', icon: 'checkmark-circle', title: 'Verify Attendance', subtitle: 'Approve labour check-ins', color: '#8B5CF6' },
          { id: 'assign', icon: 'people', title: 'Assign Tasks', subtitle: 'Delegate to labour', color: '#10B981' },
          { id: 'approve', icon: 'document-text', title: 'Approve Work', subtitle: 'Site photos & documentation', color: '#3B82F6' },
          { id: 'access', icon: 'shield-checkmark', title: 'Access Control', subtitle: 'Manage permissions', color: '#EF4444' },
          { id: 'chat', icon: 'chatbubbles', title: 'Team Chat', subtitle: 'Labour & Engineer', color: '#F59E0B' },
        ];
      case 'engineer':
        return [
          { id: 'onsite', icon: 'construct', title: 'On-site Verification', subtitle: 'Quality inspection', color: '#8B5CF6' },
          { id: 'materials', icon: 'cube', title: 'Material Request', subtitle: 'Procurement', color: '#10B981' },
          { id: 'approvals', icon: 'document-attach', title: 'Approvals', subtitle: 'Review documents', color: '#3B82F6' },
          { id: 'assign-task', icon: 'git-branch', title: 'Assign to Supervisor', subtitle: 'Task delegation', color: '#F59E0B' },
          { id: 'chat', icon: 'chatbubbles', title: 'Communications', subtitle: 'Supervisor & Owner', color: '#EC4899' },
        ];
      case 'owner':
        return [
          { id: 'site-owner', icon: 'business', title: 'Construction Site Owner', subtitle: 'Purchase & Payments', color: '#8B5CF6' },
          { id: 'payments', icon: 'card', title: 'GST Invoice', subtitle: 'Generate invoices', color: '#10B981' },
          { id: 'dealer', icon: 'storefront', title: 'Dealer Login', subtitle: 'Marketplace access', color: '#3B82F6' },
          { id: 'chatbot', icon: 'chatbubbles', title: 'AI Assistant', subtitle: 'Get help & insights', color: '#F59E0B' },
        ];
      default:
        return [];
    }
  };

  const handleFeaturePress = (featureId: string) => {
    if (featureId === 'attendance') {
      handleOpenAttendance();
    } else if (featureId === 'chat') {
      router.push('/(tabs)/chat');
    }
    // Add other feature handlers here
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👷</Text>
            </View>
            <View>
              <Text style={styles.greetingText}>{getGreeting()}</Text>
              <Text style={styles.nameText}>{getRoleName()}</Text>
              {user && (
                <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Role-specific Features Grid */}
        <View style={styles.featuresContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            {user && ['supervisor', 'engineer', 'owner'].includes(user.role) && attendanceRecords.length > 0 && (
              <TouchableOpacity style={styles.viewRecordsButton}>
                <Ionicons name="list" size={16} color="#8B5CF6" />
                <Text style={styles.viewRecordsText}>
                  {attendanceRecords.filter(r => format(r.timestamp, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length} Present
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.featuresGrid}>
            {getRoleFeatures().map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={styles.featureCard}
                onPress={() => handleFeaturePress(feature.id)}
              >
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                  <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureTitle} numberOfLines={2}>{feature.title}</Text>
                <Text style={styles.featureSubtitle} numberOfLines={1}>{feature.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Strip */}
        <View style={styles.dateStripContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((date, index) => {
              const isSelected =
                format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedDate(date)}
                  style={[
                    styles.dateCard,
                    isSelected && styles.dateCardActive,
                  ]}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>
                    {format(date, 'EEE').substring(0, 3)}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberActive]}>
                    {format(date, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Your Tasks Section */}
        <View style={styles.tasksContainer}>
          <Text style={styles.tasksTitle}>{t('home.yourTasks')}</Text>

          <View style={styles.tasksGrid}>
            {/* Large Card */}
            <View style={styles.taskLargeColumn}>
              <TaskCard task={tasks[0]} isLarge />
            </View>

            {/* Two Stacked Cards */}
            <View style={styles.taskSmallColumn}>
              <View style={styles.taskSmallTop}>
                <TaskCard task={tasks[1]} />
              </View>
              <View style={styles.taskSmallBottom}>
                <TaskCard task={tasks[2]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowAttendanceModal(false);
            setCapturedPhoto(null);
          }}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Attendance</Text>
              <TouchableOpacity onPress={() => {
                setShowAttendanceModal(false);
                setCapturedPhoto(null);
              }}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.requirementItem}>
                <Ionicons name="location" size={24} color="#8B5CF6" />
                <View style={styles.requirementText}>
                  <Text style={styles.requirementTitle}>GPS Location</Text>
                  <Text style={styles.requirementSubtitle}>
                    {currentLocation ? `${currentLocation.coords.latitude.toFixed(4)}, ${currentLocation.coords.longitude.toFixed(4)}` : 'Detecting...'}
                  </Text>
                </View>
                <Ionicons name={currentLocation ? "checkmark-circle" : "ellipse-outline"} size={24} color={currentLocation ? "#10B981" : "#9CA3AF"} />
              </View>

              <View style={styles.requirementItem}>
                <Ionicons name="time" size={24} color="#8B5CF6" />
                <View style={styles.requirementText}>
                  <Text style={styles.requirementTitle}>Timestamp</Text>
                  <Text style={styles.requirementSubtitle}>{format(new Date(), 'hh:mm a, MMM dd')}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>

              <TouchableOpacity 
                style={[styles.requirementItem, styles.clickableItem]}
                onPress={handleOpenCamera}
                activeOpacity={0.7}
              >
                <Ionicons name="camera" size={24} color="#8B5CF6" />
                <View style={styles.requirementText}>
                  <Text style={styles.requirementTitle}>Live Photo</Text>
                  <Text style={[styles.requirementSubtitle, styles.tapPrompt]}>
                    {capturedPhoto ? 'Photo captured ✓' : 'Tap to capture'}
                  </Text>
                </View>
                {capturedPhoto ? (
                  <Image source={{ uri: capturedPhoto }} style={styles.photoThumbnail} />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#9CA3AF" />
                )}
              </TouchableOpacity>

              {capturedPhoto && (
                <View style={styles.photoPreviewContainer}>
                  <Image source={{ uri: capturedPhoto }} style={styles.photoPreview} />
                  <TouchableOpacity 
                    style={styles.retakeButton}
                    onPress={handleOpenCamera}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-reverse" size={16} color="#fff" />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.warningBox}>
                <Ionicons name="information-circle" size={20} color="#F59E0B" />
                <Text style={styles.warningText}>
                  GPS tracking will verify your location every 2 hours to ensure on-site presence
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.markButton, (!capturedPhoto || !currentLocation) && styles.markButtonDisabled]}
              onPress={handleMarkPresent}
              disabled={!capturedPhoto || !currentLocation}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.markButtonText}>Mark Present</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          >
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.cameraCloseButton}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>

              <View style={styles.cameraGuide}>
                <Text style={styles.cameraGuideText}>Position your face in the frame</Text>
                <View style={styles.faceOutline} />
              </View>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Attendance Records Section - Show only for supervisors/engineers/owners */}
      {user && ['supervisor', 'engineer', 'owner'].includes(user.role) && attendanceRecords.length > 0 && (
        <Modal
          visible={false}
          transparent
          animationType="fade"
        >
          <View style={styles.recordsOverlay}>
            <View style={styles.recordsContainer}>
              <Text style={styles.recordsTitle}>Attendance Records (Today)</Text>
              <ScrollView style={styles.recordsList}>
                {attendanceRecords
                  .filter(r => format(r.timestamp, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
                  .map((record) => (
                    <View key={record.id} style={styles.recordCard}>
                      <Image source={{ uri: record.photoUri }} style={styles.recordPhoto} />
                      <View style={styles.recordDetails}>
                        <Text style={styles.recordUser}>{record.userId}</Text>
                        <Text style={styles.recordTime}>{format(record.timestamp, 'hh:mm a')}</Text>
                        <Text style={styles.recordLocation}>
                          📍 {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                        </Text>
                      </View>
                      <View style={[styles.recordStatus, { backgroundColor: '#D1FAE5' }]}>
                        <Text style={[styles.recordStatusText, { color: '#10B981' }]}>Present</Text>
                      </View>
                    </View>
                  ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function TaskCard({ task, isLarge = false }: { task: Task; isLarge?: boolean }) {
  return (
    <View style={[styles.taskCard, isLarge && styles.taskCardLarge]}>
      <View style={styles.taskContent}>
        <View>
          <View
            style={[
              styles.statusBadge,
              task.status === 'completed' ? styles.statusCompleted : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                task.status === 'completed' ? styles.statusTextCompleted : styles.statusTextPending,
              ]}
            >
              {task.status === 'completed' ? '✓ Completed' : '⏰ Pending'}
            </Text>
          </View>

          <Text style={[styles.taskTitle, isLarge && styles.taskTitleLarge]}>
            {task.title}
          </Text>

          <View style={styles.taskInfo}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.taskInfoText}>{task.time}</Text>
          </View>

          <View style={styles.taskInfo}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.taskInfoText} numberOfLines={1}>
              {task.location}
            </Text>
          </View>
        </View>

        <View style={styles.taskFooter}>
          <View style={styles.supervisorAvatar}>
            <Text style={styles.supervisorEmoji}>{task.supervisorAvatar}</Text>
          </View>
          <Text style={styles.supervisorName} numberOfLines={1}>
            {task.supervisor}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  greetingText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  syncedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  heroEmoji: {
    fontSize: 56,
  },
  dateStripContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateCardActive: {
    backgroundColor: '#8B5CF6',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dateDayActive: {
    color: '#fff',
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginTop: 4,
  },
  dateNumberActive: {
    color: '#fff',
  },
  tasksContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  tasksGrid: {
    flexDirection: 'row',
    height: 400,
  },
  taskLargeColumn: {
    flex: 1,
    marginRight: 12,
  },
  taskSmallColumn: {
    flex: 1,
  },
  taskSmallTop: {
    flex: 1,
    marginBottom: 12,
  },
  taskSmallBottom: {
    flex: 1,
  },
  taskCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  taskCardLarge: {
    height: '100%',
  },
  taskContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: '#10B981',
  },
  statusTextPending: {
    color: '#F59E0B',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  taskTitleLarge: {
    fontSize: 18,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  supervisorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  supervisorEmoji: {
    fontSize: 16,
  },
  supervisorName: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  bottomSpacer: {
    height: 100,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  viewRecordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewRecordsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 6,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
    lineHeight: 18,
  },
  featureSubtitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  modalBody: {
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  clickableItem: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  tapPrompt: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  requirementText: {
    flex: 1,
    marginLeft: 12,
  },
  requirementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  requirementSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  markButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  markButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  markButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  photoThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  photoPreviewContainer: {
    position: 'relative',
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 16,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  cameraCloseButton: {
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  cameraGuide: {
    alignItems: 'center',
  },
  cameraGuideText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  faceOutline: {
    width: 200,
    height: 250,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  captureButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#8B5CF6',
  },
  recordsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  recordsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  recordsList: {
    maxHeight: 400,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  recordDetails: {
    flex: 1,
  },
  recordUser: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  recordTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  recordLocation: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  recordStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recordStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});