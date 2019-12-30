import React from "react";
import TransactionState from "./TransactionState";

/**
 * @name TransactionRow
 *
 * @param {Object} tx
 */

const TransactionRow = ({ tx }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <View>
      <TouchableOpacity onPress={toggle}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            paddingHorizontal: 20,
            paddingVertical: 16
          }}
        >
          <View
            style={{
              height: 40,
              width: 40,
              backgroundColor: "#f0f0f0",
              borderRadius: 99999
            }}
          />

          <View
            style={{
              display: "flex",
              marginLeft: 16
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                letterSpacing: 12 * 0.01,
                fontSize: 12,
                lineHeight: 20
              }}
            >
              <TransactionState state={tx.state} />
            </Text>

            <Text
              style={{
                fontSize: 14,
                lineHeight: 20
              }}
            >
              {tx.asset.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <Text
          style={{
            fontSize: 8,
            padding: 8,
            backgroundColor: "black",
            color: "white"
          }}
        >
          {JSON.stringify(tx, null, 2)}
        </Text>
      )}
    </View>
  );
};
export default TransactionRow;
