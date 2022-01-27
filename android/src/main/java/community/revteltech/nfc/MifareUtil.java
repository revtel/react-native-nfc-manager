package community.revteltech.nfc;

import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;

import java.io.File;
import java.util.*;
import java.nio.charset.Charset;

class MifareUtil {
	/**
	 * Checks if Mifare is supported on a device with some heuristics.
	 * Will _try_ to detect if Mifare is supported on a device or not. Please note that it's not fool-proof: I've
	 * seen on some older devices (Samsung Galaxy S4) the method returning true, while we can only detect it fails
	 * when a tag is scanned. Unfortunately there's nothing to do about it. But still it's a good effort and a
	 * better approach than blacklisting devices imho.
	 *
	 * Credits: ikarus23 (https://github.com/ikarus23/MifareClassicTool)
	 * @see https://github.com/ikarus23/MifareClassicTool/blob/master/Mifare%20Classic%20Tool/app/src/main/java/de/syss/MifareClassicTool/Common.java#L588
	 * @see https://github.com/ikarus23/MifareClassicTool/blob/master/INCOMPATIBLE_DEVICES.md
	 *
	 * @param  currentActivity  The activity (should be passed since this is a static utility method).
	 * @return The fact if a device is supported or not.
	 */
	public static boolean isDeviceSupported(Activity currentActivity) {
		if (currentActivity == null) {
			return false;
		}

		if (!currentActivity.getPackageManager().hasSystemFeature(PackageManager.FEATURE_NFC)) {
			return false;
		}

		boolean foundViaFeatures = currentActivity.getPackageManager().hasSystemFeature("com.nxp.mifare");
		if (!foundViaFeatures) {
			return false;
		}

		// The following code is thanks to ikarus23's MifareClassicTool (https://github.com/ikarus23/MifareClassicTool)
		// @see https://github.com/ikarus23/MifareClassicTool/blob/3eb37b0afa3f57f0d18f2fcdfcee2435b47886d8/Mifare%20Classic%20Tool/app/src/main/java/de/syss/MifareClassicTool/Common.java#L588

		// Check if there is the NFC device "bcm2079x-i2c".
		// Chips by Broadcom don't support MIFARE Classic.
		// This could fail because on a lot of devices apps don't have
		// the sufficient permissions.
		// Another exception:
		// The Lenovo P2 has a device at "/dev/bcm2079x-i2c" but is still
		// able of reading/writing MIFARE Classic tags. I don't know why...
		// https://github.com/ikarus23/MifareClassicTool/issues/152
		boolean isLenovoP2 = Build.MANUFACTURER.equals("LENOVO")
				&& Build.MODEL.equals("Lenovo P2a42");
		File device = new File("/dev/bcm2079x-i2c");
		if (!isLenovoP2 && device.exists()) {
			return false;
		}

		// Check if there is the NFC device "pn544".
		// The PN544 NFC chip is manufactured by NXP.
		// Chips by NXP support MIFARE Classic.
		device = new File("/dev/pn544");
		if (device.exists()) {
			return true;
		}

		// Check if there are NFC libs with "brcm" in their names.
		// "brcm" libs are for devices with Broadcom chips. Broadcom chips
		// don't support MIFARE Classic.
		File libsFolder = new File("/system/lib");
		File[] libs = libsFolder.listFiles();
		for (File lib : libs) {
			if (lib.isFile()
					&& lib.getName().startsWith("libnfc")
					&& lib.getName().contains("brcm")
				// Add here other non NXP NFC libraries.
			) {
				return false;
			}
		}

		// We don't have reason to believe that it's not supported, or we can't detect it right now (we should wait when a tag is connected and do then some heuristics)
		return true;
	}
}
