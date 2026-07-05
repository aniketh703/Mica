// Generic bottom sheet primitive: backdrop + draggable sheet, no domain
// knowledge of its contents. Built on core RN Animated + PanResponder (no new
// dependency) to stay consistent with how the rest of the app does motion.
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Platform,
  Keyboard,
  KeyboardEvent,
} from 'react-native';
import { Theme } from '../theme/palette';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { duration, easeEnter, easeExit } from '../utils/motion';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.6;

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  t: Theme;
  children: React.ReactNode;
};

export default function BottomSheet({ visible, onClose, t, children }: BottomSheetProps) {
  const reduceMotion = useReducedMotion();
  // Kept true slightly past `visible` going false, so the Modal stays mounted
  // for the exit animation instead of vanishing instantly.
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  const [dragY] = useState(() => new Animated.Value(0));
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Track the keyboard manually instead of leaning on KeyboardAvoidingView.
  // RN's Modal creates its own native window on Android, and that window
  // doesn't reliably surface resize info to KeyboardAvoidingView — the sheet
  // would sit still while the keyboard covered its lower half. Keyboard's
  // show/hide events fire off the actual system keyboard state, independent
  // of which Modal is on screen, so this works regardless of that quirk.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      dragY.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? duration.instant : duration.enter,
        easing: easeEnter,
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: reduceMotion ? duration.instant : duration.quick,
        easing: easeExit,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // `mounted` intentionally excluded — this effect only reacts to `visible`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion]);

  // useMemo (not useRef) so onClose/reduceMotion inside the handlers never go
  // stale — useRef's initializer only runs once and would freeze these
  // closures to their first-render values forever.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_evt, gesture) => {
          if (gesture.dy > 0) dragY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
            onClose();
            return;
          }
          Animated.timing(dragY, {
            toValue: 0,
            duration: reduceMotion ? duration.instant : duration.quick,
            easing: easeExit,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragY, onClose, reduceMotion]
  );

  if (!mounted) return null;

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT, 0] }),
    dragY
  );
  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: t.surface,
              // Cap height against whatever's actually left above the
              // keyboard, not just a flat 90% — otherwise on a short device
              // with the keyboard open, content could push the sheet's top
              // above the screen with no way to scroll back up to it.
              maxHeight: Math.min(SCREEN_HEIGHT * 0.9, SCREEN_HEIGHT - keyboardHeight - 40),
              marginBottom: keyboardHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Only the handle is a drag target — panHandlers must not cover
              the content below, or every tap on the form (inputs, chips,
              swatches, Save) would be swallowed by the gesture responder. */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: t.border }]} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handleArea: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
});
