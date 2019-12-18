import SegmentedControlIOS from "@react-native-community/segmented-control";
import BigNumber from "bignumber.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ethers, utils } from "ethers";
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
  Button,
  Clipboard,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import store from "react-native-simple-store";
import useSWR from "swr";
import chainIds, { NetworkIdentifier } from "./lib/chainIds";
import fetcher from "./lib/fetcher";

dayjs.extend(relativeTime);

ethers.errors.setLogLevel("error");

const truncateAddress = address =>
  `${address.slice(0, 10)}...${address.slice(address.length - 4)}`;

const ACTIVE_NETWORK = chainIds[3];

const API_BASE = "https://ethereum-api.xyz";

const toFixed = (value, decimals) =>
  new BigNumber(value).toFixed(decimals).toString();

const formatTimestamp = ts => dayjs(Number(ts)).fromNow();

const parseTxs = (txs, address) =>
  txs.map(tx => {
    let action = "";
    let state = "";

    if (tx.input === "0x") {
      action = "ETH";
    } else if (tx.input !== "0x" && tx.operations.length === 0) {
      action = "Smart Contract Execution";
    } else if (tx.operations.length > 0) {
      action = "ERC20";
    }

    if (tx.error === true) {
      state = "Error";
    } else if (tx.to === tx.from) {
      state = "Self";
    } else if (tx.from === address.toLowerCase()) {
      state = "Sent";
    } else if (tx.to === address.toLowerCase()) {
      state = "Received";
    }

    return {
      action,
      state,
      hash: tx.hash,
      timestamp: formatTimestamp(tx.timestamp),
      to: tx.to,
      from: tx.from,
      operations: tx.operations,
      symbol: tx.asset.symbol,
      value: toFixed(utils.formatEther(tx.value), 2),
      decimals: tx.asset.decimals
    };
  });

const parseBalance = bal =>
  bal.map(({ symbol, decimals, balance, name }) => ({
    symbol,
    decimals,
    balance,
    native: toFixed(utils.formatEther(balance), 4),
    name
  }));

const WalletTxs = ({ address, chainId }) => {
  const { data, error } = useSWR(
    () =>
      `${API_BASE}/account-transactions?address=${address}&chainId=${chainId}`,
    fetcher
  );

  return (
    <View>
      {!data && <ActivityIndicator size="large" />}

      {(error || (data && data.success === false)) && (
        <Text>{JSON.stringify(error)}</Text>
      )}

      {data &&
        data.result.length > 0 &&
        parseTxs(data.result, address).map((tx, i) => {
          let human = "Smart Contract Interaction";

          if (tx.state === "Received") {
            human = `You received ${tx.value} ${tx.symbol} ${tx.timestamp}`;
          } else if (tx.state === "Sent") {
            human = `You sent ${tx.value} ${tx.symbol} ${tx.timestamp}`;
          } else if (tx.state === "Self") {
            human = `You sent ${tx.value} ${tx.symbol} to yourself ${tx.timestamp}`;
          } else if (tx.state === "Error") {
            human = "Error";
          }

          return (
            <View
              key={i}
              style={{
                marginBottom: 16,
                display: "flex",
                flexDirection: "row"
              }}
            >
              <Text style={{ marginRight: 8, fontWeight: "bold" }}>
                {tx.action}
              </Text>
              <Text>
                {tx.action === "Smart Contract Execution" ? null : `${human}`}
              </Text>
            </View>
          );
        })}
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
      {!data && <ActivityIndicator size="large" />}

      {(error || (data && data.success === false)) && (
        <Text>{JSON.stringify(error)}</Text>
      )}

      {data &&
        data.result.length > 0 &&
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

const WalletCollectibles = ({ address }) => {
  const { data, error } = useSWR(
    () => `${API_BASE}/account-collectibles?address=${address}`,
    fetcher
  );

  return (
    <View>
      {!data && <ActivityIndicator size="large" />}

      {(error || (data && data.success === false)) && (
        <Text>{JSON.stringify(error)}</Text>
      )}

      {data && <Text>{JSON.stringify(data.result, null, 2)}</Text>}
    </View>
  );
};

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
        if (buttonIndex !== 0)
          saveActiveNetwork(
            Object.keys(chainIds).map(key => chainIds[key])[buttonIndex - 1].id
          );
      }
    );

  const openSettings = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          "Close",
          "Copy address",
          "Change network",
          "Backup seed phrase",
          "Delete Wallet"
        ],
        cancelButtonIndex: 0,
        title: truncateAddress(address)
      },
      buttonIndex => {
        if (buttonIndex === 1) {
          Clipboard.setString(address);
        }
        if (buttonIndex === 2) changeNetwork();

        if (buttonIndex === 3) showSeedPhrase();

        if (buttonIndex === 4) deleteWalletPrompt();
      }
    );

  const [index, setIndex] = useState(0);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <StatusBar barStyle="dark-content" />

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

          <Text
            accessibilityRole="image"
            style={{
              fontSize: 40,
              height: 48,
              textAlign: "center"
            }}
          >
            🍩
          </Text>

          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "flex-end",
              display: "flex"
            }}
          >
            {!!address && <Button title="Settings" onPress={openSettings} />}
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
                  values={["Transactions", "Balance", "Profile"]}
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
                  <WalletBalance address={address} chainId={activeNetwork} />
                ) : index === 2 ? (
                  <Text style={{ textAlign: "center", fontSize: 32 }}>👤</Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.gutter}>
              <View style={{ marginBottom: 24 }}>
                <Button
                  onPress={() => Alert.alert("Sending Coming Soon")}
                  title="Send"
                />
              </View>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
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
