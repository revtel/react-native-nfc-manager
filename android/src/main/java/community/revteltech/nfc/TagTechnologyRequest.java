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

class TagTechnologyRequest {
    static String LOG_TAG = "NfcManager-tech";
    Tag mTag;
    TagTechnology mTech;
    String mTechType;
    Callback mJsCallback;

    TagTechnologyRequest(String techType, Callback cb) {
        mTechType = techType;
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

    boolean isConnected() {
        return mTag != null;
    }

    boolean connect(Tag tag) {
        if (tag == null) {
            Log.d(LOG_TAG, "received null tag at connect()");
            return false;
        }

        mTech = null;
        mTag = tag;
        if (mTechType.equals("Ndef")) {
            mTech = Ndef.get(tag);
        } else if (mTechType.equals("NfcA")) {
            mTech = NfcA.get(tag);
        } else if (mTechType.equals("NfcB")) {
            mTech = NfcB.get(tag);
        } else if (mTechType.equals("NfcF")) {
            mTech = NfcF.get(tag);
        } else if (mTechType.equals("NfcV")) {
            mTech = NfcV.get(tag);
        } else if (mTechType.equals("IsoDep")) {
            mTech = IsoDep.get(tag);
        } else if (mTechType.equals("MifareClassic")) {
            mTech = MifareClassic.get(tag);
        } else if (mTechType.equals("MifareUltralight")) {
            mTech = MifareUltralight.get(tag);
        }

        if (mTech == null) {
            return false;
        }

        try {
            Log.d(LOG_TAG, "connect to " + mTechType);
            mTech.connect();
            return true;
        } catch (Exception ex) {
            Log.d(LOG_TAG, "fail to connect tech");
            return false;
        }
    }

    void close() {
        try {
            mTech.close();
        } catch (Exception ex) {
            Log.d(LOG_TAG, "fail to close tech");
        }
    }
}
