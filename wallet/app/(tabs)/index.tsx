import { StyleSheet } from "react-native";

import { Picker } from "@react-native-picker/picker";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { BarCodeScanner } from "expo-barcode-scanner";
import * as Clipboard from "expo-clipboard";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      {/* <NavigationContainer> */}
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="Send" component={SendScreen} />
        <Stack.Screen name="Receive" component={ReceiveScreen} />
        <Stack.Screen name="Recovery" component={RecoveryScreen} />
      </Stack.Navigator>
      {/* </NavigationContainer> */}
    </SafeAreaProvider>
  );
}

function LoginScreen({ navigation }) {
  const handleSingPassLogin = () => {
    // Implement SingPass authentication logic here
    // On successful authentication, navigate to the Wallet screen
    navigation.navigate("Wallet");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mobile Wallet</Text>
      <TouchableOpacity style={styles.button} onPress={handleSingPassLogin}>
        <Text style={styles.buttonText}>Authenticate with SingPass</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function WalletScreen({ navigation }) {
  const [balance, setBalance] = useState("0.00");
  const [transactions, setTransactions] = useState([]);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Implement logic to fetch balance, transactions, and verify SingPass authentication
    // This is where you'd check if the smart account / address has authenticated via SingPass
    setIsVerified(true); // Placeholder, replace with actual verification logic
    setTransactions([
      { id: "1", type: "Received", amount: "+0.1 ETH" },
      { id: "2", type: "Sent", amount: "-0.05 ETH" },
    ]);
  }, []);

  const handleSend = () => {
    navigation.navigate("Send");
  };

  const handleReceive = () => {
    navigation.navigate("Receive");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceTitle}>Balance</Text>
        <Text style={styles.balanceAmount}>${balance}</Text>
        {isVerified && (
          <Text style={styles.verifiedText}>SingPass Verified</Text>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleReceive}>
          <Text style={styles.buttonText}>Receive</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <Text>{item.type}</Text>
              <Text>{item.amount}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

function SendScreen() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setRecipient(data);
  };

  const handleSend = () => {
    // Implement gasless transaction logic here using Paymaster
    // For cross-chain transactions, use the selected chain
    Alert.alert(
      "Transaction Sent",
      `Sent ${amount} to ${recipient} on ${chain} chain`
    );
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Send Transaction</Text>
      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        value={recipient}
        onChangeText={setRecipient}
      />
      <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
        <Text style={styles.buttonText}>Scan QR Code</Text>
      </TouchableOpacity>
      {!scanned && (
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <Picker
        selectedValue={chain}
        onValueChange={(itemValue) => setChain(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Ethereum" value="ethereum" />
        <Picker.Item label="Binance Smart Chain" value="bsc" />
        <Picker.Item label="Polygon" value="polygon" />
      </Picker>
      <TouchableOpacity style={styles.button} onPress={handleSend}>
        <Text style={styles.buttonText}>Send (Gasless)</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function ReceiveScreen() {
  const walletAddress = "0x1234567890123456789012345678901234567890"; // Replace with actual wallet address

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert("Copied", "Wallet address copied to clipboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Receive Funds</Text>
      <View style={styles.qrContainer}>
        <Text>QR Code Placeholder</Text>
        <Text>(In a real app, render a QR code here)</Text>
      </View>
      <Text style={styles.address}>{walletAddress}</Text>
      <TouchableOpacity style={styles.button} onPress={copyToClipboard}>
        <Text style={styles.buttonText}>Copy Address</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function RecoveryScreen() {
  const handleRecovery = () => {
    // Implement SingPass account recovery logic here
    Alert.alert(
      "Account Recovery",
      "Your account has been recovered using SingPass."
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Account Recovery</Text>
      <Text style={styles.description}>
        Recover your account using SingPass authentication. This process will
        restore access to your wallet.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleRecovery}>
        <Text style={styles.buttonText}>Recover with SingPass</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  picker: {
    marginBottom: 10,
    backgroundColor: "white",
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 10,
  },
  verifiedText: {
    color: "green",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  qrContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "white",
    marginBottom: 20,
  },
  address: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    marginVertical: 10,
  },
});

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
//       headerImage={
//         <Image
//           source={require("@/assets/images/partial-react-logo.png")}
//           style={styles.reactLogo}
//         />
//       }
//     >
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit{" "}
//           <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
//           to see changes. Press{" "}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({ ios: "cmd + d", android: "cmd + m" })}
//           </ThemedText>{" "}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//         <ThemedText>
//           Tap the Explore tab to learn more about what's included in this
//           starter app.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           When you're ready, run{" "}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText>{" "}
//           to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
//           directory. This will move the current{" "}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }
