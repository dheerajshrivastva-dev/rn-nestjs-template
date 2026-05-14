/**
 * QRCodeActions Component
 * Download/Share buttons for QR code
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { FilledButton } from '../buttons/FilledButton';
import { OutlinedButton } from '../buttons/OutlinedButton';
import { Row } from '../layout/Row';

export interface QRCodeActionsProps {
  /**
   * Download handler
   */
  onDownload?: () => void;

  /**
   * Share handler
   */
  onShare?: () => void;

  /**
   * Print handler
   */
  onPrint?: () => void;

  /**
   * Whether actions are disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Button layout
   * @default 'row'
   */
  layout?: 'row' | 'column';
}

/**
 * QRCodeActions
 *
 * Action buttons for QR code operations.
 * Provides download, share, and print functionality.
 *
 * @example
 * // Basic actions
 * <QRCodeActions
 *   onDownload={downloadQR}
 *   onShare={shareQR}
 * />
 *
 * @example
 * // With print and column layout
 * <QRCodeActions
 *   onDownload={download}
 *   onShare={share}
 *   onPrint={print}
 *   layout="column"
 * />
 *
 * @example
 * // Below QR code
 * <View>
 *   <QRCodeDisplay value={data} />
 *   <QRCodeActions
 *     onDownload={handleDownload}
 *     onShare={handleShare}
 *   />
 * </View>
 */
export const QRCodeActions: React.FC<QRCodeActionsProps> = ({
  onDownload,
  onShare,
  onPrint,
  disabled = false,
  style,
  layout = 'row',
}) => {
  const ContainerComponent = layout === 'row' ? Row : View;
  const containerProps = layout === 'row' ? { gap: 12, justify: 'center' as const } : { style: styles.columnContainer };

  return (
    <ContainerComponent {...containerProps} style={style}>
      {onDownload && (
        <FilledButton
          icon="download"
          onPress={onDownload}
          disabled={disabled}
          style={layout === 'column' && styles.button}
        >
          Download
        </FilledButton>
      )}
      {onShare && (
        <OutlinedButton
          icon="share-variant"
          onPress={onShare}
          disabled={disabled}
          style={layout === 'column' && styles.button}
        >
          Share
        </OutlinedButton>
      )}
      {onPrint && (
        <OutlinedButton
          icon="printer"
          onPress={onPrint}
          disabled={disabled}
          style={layout === 'column' && styles.button}
        >
          Print
        </OutlinedButton>
      )}
    </ContainerComponent>
  );
};

const styles = StyleSheet.create({
  columnContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
