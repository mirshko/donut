import SegmentedControlIOS from "@react-native-community/segmented-control";
import { ethers } from "ethers";
import "ethers/dist/shims.js";
import { SplashScreen } from "expo";
import * as LocalAuthentication from "expo-local-authentication";
import * as Random from "expo-random";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
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

ethers.errors.setLogLevel("error");

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
    <View>
      {!data && <ActivityIndicator />}

      {(error || (data && data.success === false)) && (
        <Text>{JSON.stringify(error)}</Text>
      )}

      {apiHasResults(data) &&
        parseTxState(data.result, address)
          .map(parseTxTimestamp)
          .map((tx, i) => <Tx key={i} tx={tx} />)}
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
      <Text style={{ fontWeight: "bold" }}>{tx.ago}</Text>

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

const WalletBalance = ({ address, chainId }) => {
  const { data, error } = useSWR(
    () => `${API_BASE}/account-assets?address=${address}&chainId=${chainId}`,
    fetcher
  );

  return (
    <View>
      {!data && <ActivityIndicator />}

      {(error || (data && data.success === false)) && (
        <Text>{JSON.stringify(error)}</Text>
      )}

      {apiHasResults(data) &&
        parseBalance(data.result).map(coin => {
          return (
            <Text key={coin.symbol}>
              {coin.symbol}: {coin.native}
            </Text>
          );
        })}
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
            {activeNetwork !== 1 && !!address && (
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

        {!address && (
          <View
            style={{
              flex: 1,
              justifyContent: "center"
            }}
          >
            <Button onPress={createNewWallet} title="Create New Wallet" />

            <Button
              onPress={restoreWalletPrompt}
              title="Import Existing Wallet"
            />
          </View>
        )}

        {!!address && (
          <>
            <View style={styles.gutter}>
              <View style={{ paddingVertical: 16 }}>
                <SegmentedControlIOS
                  values={["Transactions", "Profile"]}
                  selectedIndex={index}
                  onChange={({ nativeEvent: { selectedSegmentIndex } }) =>
                    setIndex(selectedSegmentIndex)
                  }
                />
              </View>
            </View>

            <ScrollView>
              <View style={styles.gutter}>
                {index === 0 ? (
                  <WalletTxs address={address} chainId={activeNetwork} />
                ) : index === 1 ? (
                  <Text style={{ textAlign: "center", fontSize: 32 }}>👤</Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={{ paddingHorizontal: 60 }}>
              <Button
                onPress={() => Alert.alert("Sending Coming Soon")}
                title="Send"
              />
            </View>
          </>
        )}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: "#fff"
  },
  gutter: {
    paddingHorizontal: 20
  },
  divider: {
    height: 1,
    backgroundColor: "black",
    width: "100%"
  },
  section: { paddingVertical: 24 },
  container: {
    flex: 1
  }
});
