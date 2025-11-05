/**
 * Browser Notification Service (Phase 13 - US11)
 * Handles desktop notifications for new messages
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private enabled: boolean = true;

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Request notification permission (T230)
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are granted
   */
  hasPermission(): boolean {
    return this.isSupported() && this.permission === 'granted';
  }

  /**
   * Check if the tab/window is currently visible
   */
  isDocumentVisible(): boolean {
    return document.visibilityState === 'visible' && document.hasFocus();
  }

  /**
   * Enable/disable notifications (T234, T235)
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Show a browser notification (T231)
   */
  async show(options: NotificationOptions): Promise<Notification | null> {
    // Don't show if disabled (DND mode) (T235)
    if (!this.enabled) {
      console.log('Notifications disabled (DND mode)');
      return null;
    }

    // Don't show if tab is visible
    if (this.isDocumentVisible()) {
      return null;
    }

    // Request permission if not already granted
    if (!this.hasPermission()) {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  /**
   * Show notification for a new message (T231)
   */
  async showMessageNotification(
    senderName: string,
    messageContent: string,
    chatId: string,
    chatName?: string
  ): Promise<Notification | null> {
    const title = chatName ? `${senderName} in ${chatName}` : senderName;
    const body = messageContent.length > 100
      ? messageContent.substring(0, 100) + '...'
      : messageContent;

    const notification = await this.show({
      title,
      body,
      tag: `message-${chatId}`,
      data: { chatId, type: 'message' },
    });

    // Add click handler to open chat (T232)
    if (notification) {
      notification.onclick = () => {
        window.focus();
        // Navigate to chat
        window.location.href = `/chat/${chatId}`;
        notification.close();
      };
    }

    return notification;
  }

  /**
   * Play notification sound (T236 - optional)
   */
  playSound(): void {
    if (!this.enabled) {
      return;
    }

    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }
}

export const notificationService = new NotificationService();
