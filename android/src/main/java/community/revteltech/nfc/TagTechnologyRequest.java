package community.revteltech.nfc;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.TagLostException;
import android.nfc.tech.TagTechnology;
import android.nfc.tech.Ndef;
import android.nfc.tech.NfcA;
import android.nfc.tech.NfcB;
import android.nfc.tech.NfcV;
import android.nfc.tech.NfcF;
import android.nfc.tech.MifareClassic;
import android.nfc.tech.MifareUltralight;
import android.nfc.tech.IsoDep;
import android.util.Log;
import com.facebook.react.bridge.*;
import java.util.ArrayList;

class TagTechnologyRequest {
    static String LOG_TAG = "NfcManager-tech";
    Tag mTag;
    TagTechnology mTech;
    String mTechType; // the actual connected type
    ArrayList<Object> mTechTypes; // the desired types
    Callback mJsCallback;

    TagTechnologyRequest(ArrayList<Object> techTypes, Callback cb) {
        mTechTypes = techTypes;
        mJsCallback = cb;
    }

    String getTechType() {
        return mTechType;
    }

    Callback getPendingCallback() {
        return mJsCallback;
    }

    TagTechnology getTechHandle() {
        return mTech;
    }

    Tag getTagHandle() {
        return mTag;
    }

    boolean isConnected() {
        return mTech != null;
    }

    boolean connect(Tag tag) {
        if (tag == null) {
            Log.d(LOG_TAG, "received null tag at connect()");
            return false;
        }

        mTag = tag;

        for (int i = 0; i < mTechTypes.size(); i++) {
            String techType = (String)mTechTypes.get(i);

            if (techType.equals("Ndef")) {
                mTech = Ndef.get(tag);
            } else if (techType.equals("NfcA")) {
                mTech = NfcA.get(tag);
            } else if (techType.equals("NfcB")) {
                mTech = NfcB.get(tag);
            } else if (techType.equals("NfcF")) {
                mTech = NfcF.get(tag);
            } else if (techType.equals("NfcV")) {
                mTech = NfcV.get(tag);
            } else if (techType.equals("IsoDep")) {
                mTech = IsoDep.get(tag);
            } else if (techType.equals("MifareClassic")) {
                mTech = MifareClassic.get(tag);
            } else if (techType.equals("MifareUltralight")) {
                mTech = MifareUltralight.get(tag);
            }

            if (mTech == null) {
                continue;
            }

            try {
                Log.d(LOG_TAG, "connect to " + techType);
                mTech.connect();
                mTechType = techType;
                return true;
            } catch (Exception ex) {
                Log.d(LOG_TAG, "fail to connect tech");
            }
        }

        // not connected, restore to default
        mTech = null;
        mTechType = null;

        return false;
    }

    void close() {
        try {
            mTech.close();
        } catch (Exception ex) {
            Log.d(LOG_TAG, "fail to close tech");
        }
    }
}
