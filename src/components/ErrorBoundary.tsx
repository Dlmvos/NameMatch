import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, FONTS, RADIUS, SHADOWS, SPACING } from '../theme';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (__DEV__) {
      console.error('[ErrorBoundary] render error', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.emoji}>🌸</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            NameNest hit a small hiccup. Try again to return to your names.
          </Text>
          <TouchableOpacity style={[styles.button, SHADOWS.button]} onPress={this.handleRetry} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: colors.match.background,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    backgroundColor: colors.neutral.white,
  },
  emoji: {
    marginBottom: SPACING.md,
    fontSize: 48,
  },
  title: {
    marginBottom: SPACING.sm,
    color: colors.neutral.textDark,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    marginBottom: SPACING.lg,
    color: colors.neutral.textBody,
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    borderRadius: RADIUS.lg,
    backgroundColor: colors.onboarding.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  buttonText: {
    color: colors.neutral.white,
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
  },
});
