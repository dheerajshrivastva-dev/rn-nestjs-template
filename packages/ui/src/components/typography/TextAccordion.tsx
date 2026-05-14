/**
 * BodyLarge Typography Component
 * Material Design 3 - Body Large (16sp)
 * Used for: Emphasized body text
 */

import React from 'react';
import { Text, TextProps } from './Text';
import { View } from 'react-native';
import { Button } from 'react-native-paper';

export type TextAccordionProps = TextProps & {
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
};

/**
 * Text Accordion
 *
 * Text component that truncates long text with an ellipsis and expands to show full text on press.
 * Useful for descriptions, release notes, or any content that may exceed available space.
 *
 * @example
 * <TextAccordion numberOfLines={3} ellipsizeMode="tail">
 *   This is a long text that will be truncated after 3 lines. Tap to expand and see the full content.
 * </TextAccordion>
 */
export const TextAccordion: React.FC<TextAccordionProps> = (props) => {
  const { numberOfLines = 3, children, ...rest } = props;

  const [isExpanded, setIsExpanded] = React.useState(false);
  // We only want to show the 'Read More' button if the text is long enough to be truncated.
  const [isExpandable, setIsExpandable] = React.useState(false);

  const toggleNumberOfLines = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={{ marginVertical: 8, paddingHorizontal: 4 }}>
      <Text
        variant="bodySmall"
        {...rest}
        numberOfLines={isExpanded ? undefined : numberOfLines}
        onTextLayout={
          (e) => setIsExpandable(e.nativeEvent.lines.length >= numberOfLines)
        }
      >
        {children}
      </Text>
      {isExpandable && (
        <Button
          mode="text"
          onPress={toggleNumberOfLines}
          style={{ marginTop: 4, alignSelf: 'flex-start' }}
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </Button>
      )}
    </View>
  );
};
