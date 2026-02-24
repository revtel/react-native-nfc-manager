package community.revteltech.nfc;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.util.Log;

class NfcAdapterStateChangedReceiver extends BroadcastReceiver {
    interface Listener {
        void onStateChanged(String state);
    }

    private final String logTag;
    private final Listener listener;

    NfcAdapterStateChangedReceiver(String logTag, Listener listener) {
        this.logTag = logTag;
        this.listener = listener;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(logTag, "onReceive " + intent);
        final String action = intent.getAction();

        if (action != null && action.equals(NfcAdapter.ACTION_ADAPTER_STATE_CHANGED)) {
            final int state = intent.getIntExtra(NfcAdapter.EXTRA_ADAPTER_STATE, NfcAdapter.STATE_OFF);
            String stateStr = "unknown";
            switch (state) {
                case NfcAdapter.STATE_OFF:
                    stateStr = "off";
                    break;
                case NfcAdapter.STATE_TURNING_OFF:
                    stateStr = "turning_off";
                    break;
                case NfcAdapter.STATE_ON:
                    stateStr = "on";
                    break;
                case NfcAdapter.STATE_TURNING_ON:
                    stateStr = "turning_on";
                    break;
            }

            listener.onStateChanged(stateStr);
        }
    }
}
