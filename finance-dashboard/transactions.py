from faker import Faker
import pandas as pd
import random

fake = Faker()
categories = {
    "Food": ["Groceries", "Fast Food", "Restaurants"],
    "Transport": ["Uber", "Bus", "Train", "Fuel"],
    "Shopping": ["Clothing", "Electronics", "Home Goods"],
    "Utilities": ["Electricity", "Water", "Internet"],
    "Entertainment": ["Movies", "Concerts", "Games"],
    "Health": ["Pharmacy", "Clinic", "Insurance"]
}
payment_methods = ["Credit Card", "Debit Card", "Cash", "UPI", "Wallet"]

data = []
for i in range(2000):
    category = random.choice(list(categories.keys()))
    subcategory = random.choice(categories[category])
    row = {
        "TransactionID": i + 1,
        "Date": fake.date_time_between(start_date='-12M', end_date='now'),
        "Amount": round(random.uniform(5, 1000), 2),
        "Category": category,
        "Subcategory": subcategory,
        "Merchant": fake.company(),
        "PaymentMethod": random.choice(payment_methods),
        "Location": fake.city(),
        "UserID": fake.random_int(min=1, max=5)
    }
    data.append(row)

df = pd.DataFrame(data)
df.to_csv("rich_transactions.csv", index=False)
