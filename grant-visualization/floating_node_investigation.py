import pandas as pd
import zipfile
from io import StringIO

def load_zipped_csv(zip_path):
    with zipfile.ZipFile(zip_path, 'r') as z:
        # Use the correct filename based on which file we're loading
        if 'grants' in zip_path:
            csv_filename = 'grants_truncated.csv'
        else:
            csv_filename = 'charities_truncated.csv'
        
        with z.open(csv_filename) as f:
            return pd.read_csv(f)

def normalize_ein(ein):
    """Normalize EIN to match database format"""
    # Convert to string if it isn't already
    ein_str = str(ein)
    # Remove any non-numeric characters
    ein_str = ''.join(filter(str.isdigit, ein_str))
    return ein_str

def analyze_organization_connections(org_ein, grants_df, charities_df, min_amount=0):
    # Normalize the input EIN
    org_ein = normalize_ein(org_ein)
    
    # First check if organization exists
    org_info = charities_df[charities_df['filer_ein'].apply(normalize_ein) == org_ein]
    if org_info.empty:
        print(f"\nNo organization found with EIN: {org_ein}")
        print("Sample of EINs in database:", charities_df['filer_ein'].head().tolist())
        return

    org_name = org_info['filer_name'].iloc[0]
    print(f"\nAnalyzing connections for {org_name} (EIN: {org_ein})")
    
    # Find all grants where this org is filer or recipient
    grants_as_filer = grants_df[
        (grants_df['filer_ein'].apply(normalize_ein) == org_ein) & 
        (grants_df['grant_amt'] >= min_amount)
    ]
    grants_as_recipient = grants_df[
        (grants_df['grant_ein'].apply(normalize_ein) == org_ein) & 
        (grants_df['grant_amt'] >= min_amount)
    ]
    
    print(f"\nGrants given ({len(grants_as_filer)}):")
    for _, grant in grants_as_filer.iterrows():
        recipient_info = charities_df[charities_df['filer_ein'].apply(normalize_ein) == normalize_ein(grant['grant_ein'])]
        if not recipient_info.empty:
            recipient_name = recipient_info['filer_name'].iloc[0]
            print(f"  → ${grant['grant_amt']:,.2f} to {recipient_name} (EIN: {grant['grant_ein']})")
        else:
            print(f"  → ${grant['grant_amt']:,.2f} to Unknown Organization (EIN: {grant['grant_ein']})")
    
    print(f"\nGrants received ({len(grants_as_recipient)}):")
    for _, grant in grants_as_recipient.iterrows():
        filer_info = charities_df[charities_df['filer_ein'].apply(normalize_ein) == normalize_ein(grant['filer_ein'])]
        if not filer_info.empty:
            filer_name = filer_info['filer_name'].iloc[0]
            print(f"  ← ${grant['grant_amt']:,.2f} from {filer_name} (EIN: {grant['filer_ein']})")
        else:
            print(f"  ← ${grant['grant_amt']:,.2f} from Unknown Organization (EIN: {grant['filer_ein']})")
            
def main():
    print("Loading data...")
    try:
        grants_df = load_zipped_csv('grants.csv.zip')
        print("Loaded grants data. Sample of columns:", grants_df.columns.tolist())
        print("Number of grants:", len(grants_df))
        
        charities_df = load_zipped_csv('charities.csv.zip')
        print("Loaded charities data. Sample of columns:", charities_df.columns.tolist())
        print("Number of charities:", len(charities_df))
        
    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return
    
    while True:
        ein = input("\nEnter an EIN to analyze (or 'q' to quit): ")
        if ein.lower() == 'q':
            break
            
        min_amount = float(input("Enter minimum grant amount (0 for no minimum): "))
        try:
            analyze_organization_connections(ein, grants_df, charities_df, min_amount)
        except Exception as e:
            print(f"Error analyzing EIN {ein}: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()