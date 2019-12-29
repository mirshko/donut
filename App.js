import SegmentedControlIOS from "@react-native-community/segmented-control";
import { ethers } from "ethers";
import "ethers/dist/shims.js";
import { SplashScreen } from "expo";
import * as LocalAuthentication from "expo-local-authentication";
import * as Random from "expo-random";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import groupBy from "lodash.groupby";

import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
  Dimensions,
  Button as NativeButton,
  View
} from "react-native";
import store from "react-native-simple-store";
import useSWR from "swr";
import {
  parseBalance,
  parseTx,
  toFixed,
  formatTimestamp,
  isReceived,
  parseTxTimestamp,
  isSelf,
  isSent,
  parseTxState,
  truncateAddress
} from "./helpers";
import chainIds, { NetworkIdentifier } from "./lib/chainIds";
import fetcher from "./lib/fetcher";
import Layout from "./components/Layout";
import Icon from "./components/Icon";
import Button from "./components/Button";

import Start from "./views/start";

ethers.errors.setLogLevel("error");

const WINDOW_WIDTH = Dimensions.get("window").width;

const API_BASE = "https://ethereum-api.xyz";

const apiHasResults = data =>
  !!data && data.success === true && data.result.length > 0 ? true : false;

const WalletTxs = ({ address, chainId }) => {
  const { data, error } = useSWR(
    () =>
      `${API_BASE}/account-transactions?address=${address}&chainId=${chainId}`,
    fetcher
  );

  return (
    <View style={{ marginBottom: 80 }}>
      {!data && <ActivityIndicator />}

      {(error || (data && data.success === false)) && (
        <Text>{JSON.stringify(error)}</Text>
      )}

      {apiHasResults(data) &&
        Object.keys(
          groupBy(
            parseTxState(data.result, address).map(parseTxTimestamp),
            "ago"
          )
        )
          .map(title => ({
            title,
            data: groupBy(
              parseTxState(data.result, address).map(parseTxTimestamp),
              "ago"
            )[title]
          }))
          .map(({ title, data }, i) => (
            <React.Fragment key={i}>
              <Text style={{ fontSize: 32 }}>{title}</Text>
              {data.map((tx, ii) => (
                <Tx key={ii} tx={tx} />
              ))}
            </React.Fragment>
          ))}
    </View>
  );
};

/**
 *
 * @param {Object} tx
 */
const Tx = ({ tx }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <View
      style={{
        marginBottom: 24
      }}
    >
      <Text style={{ fontWeight: "bold" }}>{tx.state}</Text>

      <NativeButton
        title={isOpen ? "Hide Raw Tx" : "Show Raw TX"}
        onPress={toggle}
      />
      {isOpen && (
        <Text style={{ fontSize: 10 }}>{JSON.stringify(tx, null, 2)}</Text>
      )}
    </View>
  );
};

export default function App() {
  const [address, setAddress] = useState("");
  const [activeNetwork, setActiveNetwork] = useState(1);

  const [index, setIndex] = useState(0);

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

      SplashScreen.hide();
    } catch (e) {
      console.error(e);
    }
  };

  const restoreWallet = async mnemonic => {
    if (await loadSeedPhrase()) {
      Alert.alert(
        "Cannot Create New Wallet",
        "There is already an active wallet for this device"
      );

      return;
    }

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

  const restoreWalletPrompt = () => {
    Alert.prompt("Import", "Import your seed phrase to restore your wallet.", [
      {
        style: "cancel",
        text: "Cancel"
      },
      {
        text: "Import",
        onPress: async phrase => await restoreWallet(phrase)
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
            {!!address && <NetworkIdentifier {...chainIds[activeNetwork]} />}
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

        {!address && (
          <Start create={createNewWallet} restore={restoreWalletPrompt} />
        )}

        {!!address && (
          <>
            <ScrollView>
              <View style={styles.gutter}>
                <WalletTxs address={address} chainId={activeNetwork} />
              </View>
            </ScrollView>

            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: WINDOW_WIDTH,
                paddingTop: 8,
                paddingBottom: 24
              }}
            >
              <View style={{ paddingHorizontal: 48 }}>
                <Button onPress={openSendModal} title="Send" />
              </View>

              <View
                pointerEvents="none"
                style={{
                  alignSelf: "stretch",
                  position: "absolute",
                  width: WINDOW_WIDTH,
                  height: 96,
                  bottom: 0,
                  zIndex: -1
                }}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.0)",
                    "rgba(255, 255, 255, 1.0)"
                  ]}
                  locations={[0.1, 0.7]}
                  style={{
                    alignSelf: "stretch",
                    position: "absolute",
                    width: WINDOW_WIDTH,
                    height: 96,
                    bottom: 0,
                    zIndex: -1
                  }}
                />
              </View>
            </View>
          </>
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
