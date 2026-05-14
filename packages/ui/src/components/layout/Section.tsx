/**
 * Section Component
 * Content section with optional title
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { TitleMedium } from '../typography/TitleMedium';

export interface SectionProps extends ViewProps {
  /**
   * Child components to render inside section
   */
  children: React.ReactNode;

  /**
   * Optional section title
   */
  title?: string;

  /**
   * Spacing between title and content (default 12dp)
   */
  titleSpacing?: number;

  /**
   * Custom margin bottom (default 24dp)
   */
  marginBottom?: number;
}

/**
 * Section
 *
 * Content section component with optional title header.
 * Provides consistent spacing between sections.
 *
 * @example
 * // Section without title
 * <Section>
 *   <Text>Section content</Text>
 * </Section>
 *
 * @example
 * // Section with title
 * <Section title="Personal Information">
 *   <TextField label="Name" />
 *   <TextField label="Email" />
 * </Section>
 *
 * @example
 * // Custom spacing
 * <Section title="Details" titleSpacing={16} marginBottom={32}>
 *   <Text>Content here</Text>
 * </Section>
 */
export const Section: React.FC<SectionProps> = ({
  children,
  title,
  titleSpacing,
  marginBottom,
  style,
  ...props
}) => {
  const theme = useTheme();

  const sectionStyle = [
    {
      marginBottom: marginBottom ?? theme.spacing.xxxl, // Default 24dp
    },
    style,
  ];

  return (
    <View style={sectionStyle} {...props}>
      {title && (
        <TitleMedium style={{ marginBottom: titleSpacing ?? theme.spacing.lg }}>
          {title}
        </TitleMedium>
      )}
      {children}
    </View>
  );
};
