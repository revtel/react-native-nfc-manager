package community.revteltech.nfc;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactApplicationContext;

/**
 * Temporary Android-side holder for iOS-only API stubs required by the shared RN spec.
 *
 * TODO: Remove this class after splitting platform specs so Android no longer needs iOS methods.
 */
@Deprecated
abstract class NfcManagerIOSStubBase extends NativeNfcManagerSpec {
    NfcManagerIOSStubBase(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public void setAlertMessage(String message, Callback callback) {
    }

    @Override
    public void isSessionAvailable(Callback callback) {
    }

    @Override
    public void isTagSessionAvailable(Callback callback) {
    }

    @Override
    public void sendMifareCommand(ReadableArray bytes, Callback callback) {
    }

    @Override
    public void sendCommandAPDU(ReadableMap payload, Callback callback) {
    }

    @Override
    public void sendCommandAPDUBytes(ReadableArray bytes, Callback callback) {
    }

    @Override
    public void sendFelicaCommand(ReadableArray bytes, Callback callback) {
    }

    @Override
    public void restartTechnologyRequest(Callback callback) {
    }

    @Override
    public void invalidateSession(Callback callback) {
    }

    @Override
    public void invalidateSessionWithError(String message, Callback callback) {
    }

    @Override
    public void iso15693_getSystemInfo(double requestFlag, Callback callback) {
    }

    @Override
    public void iso15693_readSingleBlock(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_readMultipleBlocks(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_writeSingleBlock(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_lockBlock(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_writeAFI(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_lockAFI(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_writeDSFID(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_lockDSFID(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_resetToReady(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_select(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_stayQuiet(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_customCommand(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_sendRequest(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_extendedReadSingleBlock(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_extendedReadMultipleBlocks(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_extendedWriteSingleBlock(ReadableMap options, Callback callback) {
    }

    @Override
    public void iso15693_extendedLockBlock(ReadableMap options, Callback callback) {
    }
}
