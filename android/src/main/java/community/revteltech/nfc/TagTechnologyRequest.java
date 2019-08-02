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
    String mTechType;
    ArrayList<Object> mTechTypes;

    Callback mJsCallback;

    TagTechnologyRequest(String techType, Callback cb) {
        mTechTypes = new ArrayList<Object>();
        mTechTypes.add(techType);
        mJsCallback = cb;
    }

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
        int i = 0;
        boolean connection = false;
        while(i < mTechTypes.size() && connection == false){
          mTechType = (String)mTechTypes.get(i);
          i++;
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
            connection = false;
          }

          try {
            Log.d(LOG_TAG, "connect to " + mTechType);
            mTech.connect();
            connection = true;
          } catch (Exception ex) {
            Log.d(LOG_TAG, "fail to connect tech");
            connection = false;
          }
        }
        return connection;
    }


    void close() {
        try {
            mTech.close();
        } catch (Exception ex) {
            Log.d(LOG_TAG, "fail to close tech");
        }
    }
}
