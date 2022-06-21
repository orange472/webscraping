# webscraping

Run `npm install` to install the project's packages and dependencies.

To run the program, run `node main` in the terminal.

## main.js
Inside `main.js`, there is a function called `pullData()`. 
```
pullData();

function pullData() {
	// code here
}
```
Inside `pullData()` is where the program's input is loaded and stored inside the variables `tableNames` (a 1D array holding the table names) and `columnNames` (a 2D array holding the column names for each table).
```
const doc = yaml.load(fs.readFileSync("./content/input.yml")); // example of loading input
```
There are also additional variables that you can modify:

|Name|Type|Description|
|--|--|--|
|`url`|string?|If not null, the program will only scrape the given url |
|`depth`|number|Represents how far from the original url that the program will scrape
|`breadth`|number|Represents how many links per page that the program will scrape
|`source`|string?|Doesn't affect the program and is intended for logging purposes
|`targets`|string[]|Holds the labels of the data that the user wants to scrape, e.g. "description".|
|`strategy`|number|Represents the formatting strategy to use. See "Formatting Strategies" for the actual stragies.|

## Formatting Strategies
 1. The column name is in the first column of the table and the data label and data itself share a cell.  Here is an [example](https://developer.salesforce.com/docs/atlas.en-us.234.0.object_reference.meta/object_reference/sforce_api_objects_account.htm) where the target is "description".
 2. The column name is in the first column of the table and the table has column headers that indicate what data each column holds. Here is an [example](https://www.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2017_2/odbc/record/accountingperiod.html) where the targets are "description" and "type".
 3. The user manually defines where to look for data with a few keyboard presses and the program handles the rest (recommended).

