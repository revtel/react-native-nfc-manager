package community.revteltech.nfc;

import android.nfc.Tag;
import android.nfc.tech.TagTechnology;
import android.nfc.tech.Ndef;
import android.nfc.tech.NfcA;
import android.nfc.tech.NfcB;
import android.nfc.tech.NfcV;
import android.nfc.tech.NfcF;
import android.nfc.tech.MifareClassic;
import android.nfc.tech.MifareUltralight;
import android.nfc.tech.NdefFormatable;
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

    void invokePendingCallbackWithError(String err) {
        if (mJsCallback != null) {
            mJsCallback.invoke(err);
            mJsCallback = null;
        }
    }

    void invokePendingCallback(String connectedTech) {
        if (mJsCallback != null) {
            mJsCallback.invoke(null, connectedTech);
            mJsCallback = null;
        }
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

            switch (techType) {
                case "Ndef":
                    mTech = Ndef.get(tag);
                    break;
                case "NfcA":
                    mTech = NfcA.get(tag);
                    break;
                case "NfcB":
                    mTech = NfcB.get(tag);
                    break;
                case "NfcF":
                    mTech = NfcF.get(tag);
                    break;
                case "NfcV":
                    mTech = NfcV.get(tag);
                    break;
                case "IsoDep":
                    mTech = IsoDep.get(tag);
                    break;
                case "MifareClassic":
                    mTech = MifareClassic.get(tag);
                    break;
                case "MifareUltralight":
                    mTech = MifareUltralight.get(tag);
                    break;
                case "NdefFormatable":
                    mTech = NdefFormatable.get(tag);
                    break;
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
