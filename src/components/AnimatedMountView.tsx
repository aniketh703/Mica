import React, { useEffect, useState } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { duration, easeEnter, easeExit } from '../utils/motion';

export type EnterConfig = {
  duration: number;
  delay?: number;
  fromTranslateY?: number;
  fromScale?: number;
};

export type ExitConfig = {
  duration: number;
  toTranslateY?: number;
};

export function useEnterAnimation(config: EnterConfig) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) {
      progress.stopAnimation();
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: config.duration,
      delay: config.delay ?? 0,
      easing: easeEnter,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [config.delay, config.duration, progress, reduceMotion]);

  const transforms: unknown[] = [];
  if (config.fromTranslateY !== undefined) {
    transforms.push({
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [config.fromTranslateY, 0],
      }),
    });
  }
  if (config.fromScale !== undefined) {
    transforms.push({
      scale: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [config.fromScale, 1],
      }),
    });
  }

  return { opacity: progress, transform: transforms as ViewStyle['transform'] };
}

// Drives opacity 1→0 and optional translateY 0→N on a boolean trigger.
// Call with `exiting={true}` then unmount on the animation's onFinish callback.
export function useExitAnimation(exiting: boolean, config: ExitConfig) {
  const reduceMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!exiting) return;

    if (reduceMotion) {
      progress.setValue(0);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 0,
      duration: config.duration,
      easing: easeExit,
      useNativeDriver: true,
    });

    animation.start();
    return () => animation.stop();
  }, [config.duration, exiting, progress, reduceMotion]);

  const transforms: unknown[] = [];
  if (config.toTranslateY !== undefined) {
    transforms.push({
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [config.toTranslateY, 0],
      }),
    });
  }

  return { opacity: progress, transform: transforms as ViewStyle['transform'] };
}

// Staggered enter — each item delays by index * stagger ms.
// Usage: const style = useStaggeredEnter(i, { duration: duration.standard, stagger: 40, fromTranslateY: 8 });
export function useStaggeredEnter(
  index: number,
  config: EnterConfig & { stagger?: number },
) {
  const { stagger = 50, delay = 0, ...rest } = config;
  return useEnterAnimation({ ...rest, delay: delay + index * stagger });
}

// Exit-before-unmount contract — keeps `rendered` true until the exit animation
// finishes, then sets it to false so the caller can conditionally render.
//
// Usage:
//   const { rendered, style } = useAnimatedPresence(visible, duration.quick);
//   if (!rendered) return null;
//   return <Animated.View style={style}>...</Animated.View>;
export function useAnimatedPresence(visible: boolean, exitDuration: number = duration.quick) {
  const reduceMotion = useReducedMotion();
  const [rendered, setRendered] = useState(visible);
  const [opacity] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    if (visible) setRendered(true);
  }, [visible]);

  useEffect(() => {
    if (!rendered) return;

    if (reduceMotion) {
      opacity.setValue(visible ? 1 : 0);
      if (!visible) setRendered(false);
      return;
    }

    const anim = Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: visible ? duration.enter : exitDuration,
      easing: visible ? easeEnter : easeExit,
      useNativeDriver: true,
    });

    anim.start(({ finished }) => {
      if (finished && !visible) setRendered(false);
    });

    return () => anim.stop();
  }, [exitDuration, opacity, rendered, reduceMotion, visible]);

  return { rendered, style: { opacity } };
}

export default function AnimatedMountView({
  children,
  config,
  style,
}: {
  children: React.ReactNode;
  config: EnterConfig;
  style?: object;
}) {
  const enterStyle = useEnterAnimation(config);
  return <Animated.View style={[enterStyle, style]}>{children}</Animated.View>;
}
