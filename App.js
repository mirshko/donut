import { ethers } from "ethers";
import "ethers/dist/shims.js";
import { SplashScreen } from "expo";
import * as LocalAuthentication from "expo-local-authentication";
import * as Random from "expo-random";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState, Fragment } from "react";

import {
  ActionSheetIOS,
  Alert,
  Clipboard,
  StyleSheet,
  Button as NativeButton,
  View
} from "react-native";
import store from "react-native-simple-store";
import chainIds, { NetworkIdentifier } from "./lib/chainIds";
import Layout from "./components/Layout";
import Icon from "./components/Icon";

import Start from "./views/start";
import Transactions from "./views/transactions";

ethers.errors.setLogLevel("error");

export default function App() {
  const [address, setAddress] = useState("");
  const [activeNetwork, setActiveNetwork] = useState(1);

  useEffect(() => {
    SplashScreen.preventAutoHide();

    try {
      getActiveNetwork();

      getWalletAddress();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadSeedPhrase = async () => {
    try {
      const mnemonic = await SecureStore.getItemAsync(
        "secureDonutWalletMnemonic"
      );

      return mnemonic;
    } catch (e) {
      console.error(e);
    }
  };

  const showSeedPhrase = async () => {
    try {
      let results = await LocalAuthentication.authenticateAsync();

      if (results.success) {
        const mnemonic = await loadSeedPhrase();

        Alert.alert("Your Seed Phrase", mnemonic, [
          { text: "Copy", onPress: () => Clipboard.setString(mnemonic) }
        ]);
      } else {
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getActiveNetwork = async () => {
    try {
      const network = await store.get("donutActiveNetwork");

      if (!!(await network)) setActiveNetwork(await network);
    } catch (e) {
      console.error(e);
    }
  };

  const saveActiveNetwork = async network => {
    try {
      await store.save("donutActiveNetwork", network);

      setActiveNetwork(network);
    } catch (e) {
      console.error(e);
    }
  };

  const getWalletAddress = async () => {
    try {
      const address = await store.get("donutWalletAddress");

      if (await address) {
        setAddress(await address);
      }

      if ((await address) === null && (await loadSeedPhrase())) {
        await restoreWallet();
      }

      SplashScreen.hide();
    } catch (e) {
      console.error(e);
    }
  };

  const restoreWallet = async () => {
    try {
      const mnemonic = await loadSeedPhrase();

      if (!!mnemonic) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);

        /**
         * Store restored wallet address in AsyncStorage
         */
        await store.save("donutWalletAddress", wallet.address);

        await getWalletAddress();
      }

      return;
    } catch (e) {
      console.error(e);
    }
  };

  const replaceWallet = async mnemonic => {
    try {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);

      /**
       * Store new wallet mnemonic in SecureStorage
       */
      SecureStore.setItemAsync("secureDonutWalletMnemonic", mnemonic, {
        keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
      });

      /**
       * Store new wallet address in AsyncStorage
       */
      await store.save("donutWalletAddress", wallet.address);

      await getWalletAddress();
    } catch (e) {
      console.error(e);
    }
  };

  const replaceWalletPrompt = () => {
    Alert.prompt("Import", "Import your seed phrase to restore your wallet.", [
      {
        style: "cancel",
        text: "Cancel"
      },
      {
        text: "Import",
        onPress: async phrase => await replaceWallet(phrase)
      }
    ]);
  };

  const createNewWallet = async () => {
    if (await loadSeedPhrase()) {
      Alert.alert(
        "Cannot Create New Wallet",
        "There is already an active wallet for this device"
      );

      return;
    }

    try {
      const randomBytes = await Random.getRandomBytesAsync(16);

      const wallet = ethers.Wallet.createRandom({ extraEntropy: randomBytes });

      /**
       * Store new wallet mnemonic in SecureStorage
       */
      SecureStore.setItemAsync("secureDonutWalletMnemonic", wallet.mnemonic, {
        keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
      });

      /**
       * Store new wallet address in AsyncStorage
       */
      await store.save("donutWalletAddress", wallet.address);

      await getWalletAddress();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteWallet = async () => {
    try {
      await SecureStore.deleteItemAsync("secureDonutWalletMnemonic");

      await store.delete("donutWalletAddress");

      setAddress("");
    } catch (e) {
      console.error(e);
    }
  };

  const deleteWalletPrompt = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Delete Wallet"],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
        title: "Delete Your Wallet?",
        message:
          "You cannot undo this action, deleting your wallet is perminant and cannot be recovered"
      },
      buttonIndex => {
        if (buttonIndex === 1) deleteWallet();
      }
    );

  const changeNetwork = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          "Cancel",
          ...Object.keys(chainIds).map(key => chainIds[key].name)
        ],
        cancelButtonIndex: 0,
        title: "Change Network"
      },
      buttonIndex => {
        if (buttonIndex !== 0) {
          saveActiveNetwork(
            Object.keys(chainIds).map(key => chainIds[key])[buttonIndex - 1].id
          );
          return;
        }

        return;
      }
    );

  const openSettings = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          "Close",
          "Change network",
          "Backup seed phrase",
          "Delete Wallet"
        ],
        cancelButtonIndex: 0
      },
      buttonIndex => {
        if (buttonIndex === 1) {
          changeNetwork();
          return;
        }

        if (buttonIndex === 2) {
          showSeedPhrase();
          return;
        }

        if (buttonIndex === 3) {
          deleteWalletPrompt();
          return;
        }

        return;
      }
    );

  const openSendModal = () =>
    Alert.alert(
      "Send Coming Soon",
      "Sending money in Donut Wallet coming soon."
    );

  return (
    <Layout>
      <View style={styles.container}>
        {!address ? (
          <Start create={createNewWallet} restore={replaceWalletPrompt} />
        ) : (
          <Fragment>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                ...styles.gutter
              }}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "flex-start",
                  display: "flex"
                }}
              >
                {!!address && (
                  <NetworkIdentifier {...chainIds[activeNetwork]} />
                )}
              </View>

              <Icon />

              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "flex-end",
                  display: "flex"
                }}
              >
                {!!address && (
                  <NativeButton title="Settings" onPress={openSettings} />
                )}
              </View>
            </View>

            <Transactions
              address={address}
              chainId={activeNetwork}
              onSend={openSendModal}
            />
          </Fragment>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  gutter: {
    paddingHorizontal: 24
  },
  container: {
    flex: 1,
    position: "relative"
  }
});
