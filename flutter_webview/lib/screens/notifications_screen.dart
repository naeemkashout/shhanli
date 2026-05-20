import 'package:flutter/material.dart';

import '../models/notification_item.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<NotificationItem>> _futureNotifications;

  @override
  void initState() {
    super.initState();
    _futureNotifications = ApiService.instance.getNotifications();
  }

  Future<void> _refresh() async {
    setState(() {
      _futureNotifications = ApiService.instance.getNotifications();
    });
    await _futureNotifications;
  }

  Future<void> _markAllRead() async {
    try {
      await ApiService.instance.markAllNotificationsAsRead();
      _refresh();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('All notifications marked as read')));
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Future<void> _markRead(String id) async {
    try {
      await ApiService.instance.markNotificationAsRead(id);
      _refresh();
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<NotificationItem>>(
          future: _futureNotifications,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(
                child: Text(snapshot.error.toString(), style: const TextStyle(color: Colors.red)),
              );
            }

            final notifications = snapshot.data ?? [];
            if (notifications.isEmpty) {
              return const Center(child: Text('No notifications yet.'));
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length + 1,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return ElevatedButton(
                    onPressed: _markAllRead,
                    child: const Text('Mark all as read'),
                  );
                }

                final notification = notifications[index - 1];
                return ListTile(
                  title: Text(notification.title),
                  subtitle: Text(notification.message),
                  trailing: notification.isRead ? null : const Icon(Icons.circle, color: Colors.blue, size: 12),
                  onTap: () => _markRead(notification.id),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
