from sqlalchemy import create_engine, Table, Column, Integer, String, MetaData, Date, Numeric
from sqlalchemy.orm import sessionmaker

# Database connection string (no password version)
DB_URL = 'postgresql://admin:yourpassword@localhost/finance_db'

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()
metadata = MetaData()

transactions_table = Table('transactions', metadata,
    Column('id', Integer, primary_key=True),
    Column('date', Date),
    Column('amount', Numeric),
    Column('description', String), 
    Column('category', String),
    Column('subcategory', String),
    Column('merchant', String),
    Column('payment_method', String),
    Column('location', String),
    Column('user_id', Integer)
)
