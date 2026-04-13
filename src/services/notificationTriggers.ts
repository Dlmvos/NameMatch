import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const permissions = await Notifications.getPermissionsAsync();

  if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return !!requested.granted;
}

export async function notifyMatch(name: string): Promise<void> {
  const ok = await ensureNotificationPermission();
  if (!ok) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "It's a match",
      body: `You both liked ${name}.`,
    },
    trigger: null,
  });
}

export async function notifyPartnerActivity(count: number): Promise<void> {
  if (count <= 0) return;

  const ok = await ensureNotificationPermission();
  if (!ok) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Partner activity',
      body: `Your partner liked ${count} name${count === 1 ? '' : 's'} today.`,
    },
    trigger: null,
  });
}

export async function notifyPotentialMatches(count: number): Promise<void> {
  if (count <= 0) return;

  const ok = await ensureNotificationPermission();
  if (!ok) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Potential matches waiting',
      body: `You may have ${count} potential match${count === 1 ? '' : 'es'} to review.`,
    },
    trigger: null,
  });
}
