import React from "react";
import groupBy from "lodash.groupby";
import { SectionList, Text, View } from "react-native";
import useSWR, { trigger } from "swr";
import { parseTxTimestamp, parseTxState, apiHasResults } from "../helpers";
import { API_BASE } from "../constants";
import fetcher from "../lib/fetcher";
import Transaction from "./TransactionRow";

/**
 * @name TransactionList
 *
 * @param {String} address
 * @param {Number} chainId
 */

const TransactionList = ({ address, chainId }) => {
  const { data, error, isValidating, revalidate } = useSWR(
    () =>
      `${API_BASE}/account-transactions?address=${address}&chainId=${chainId}`,
    fetcher
  );

  return (
    <View style={{ marginBottom: 80 }}>
      {(error || (data && data.success === false)) && (
        <Text>{JSON.stringify(error)}</Text>
      )}

      <SectionList
        refreshing={!data || isValidating}
        onRefresh={revalidate}
        style={{ alignSelf: "stretch", height: "100%" }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !!data && (
            <Text style={{ textAlign: "center", padding: 32, fontSize: 40 }}>
              📭
            </Text>
          )
        }
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={{
              marginVertical: 16,
              alignSelf: "center",
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: "#f0f0f0",
              borderRadius: 99999
            }}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "500", textAlign: "center" }}
            >
              {title}
            </Text>
          </View>
        )}
        keyExtractor={(item, i) => i}
        renderItem={({ item }) => <Transaction tx={item} />}
        sections={
          apiHasResults(data) &&
          Object.keys(
            groupBy(
              parseTxState(data.result, address).map(parseTxTimestamp),
              "ago"
            )
          ).map(title => ({
            title,
            data: groupBy(
              parseTxState(data.result, address).map(parseTxTimestamp),
              "ago"
            )[title]
          }))
        }
      />
    </View>
  );
};

export default TransactionList;
