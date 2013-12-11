var esprima = require('esprima');
var options = {tokens:true, tolerant: true, loc: true, range: true };

exports.extractExports = function(path)
{
	try
	{
		var module = require(path);
		var exported = [];
		for( var func in module)
		{
			exported.push( func );
		}
		return exported;
	}
	catch(e)
	{
		console.log(e);	
	}
	return [];
}


exports.extractMarkers = function(data)
{
	var result = esprima.parse(data, options);
	var markers = {};

	traverse(result, function (node) 
	{
   	if (node.type === 'FunctionDeclaration') 
   	{
   		//console.log( node.loc.start.line + ":" + functionName(node) );
		}
		if( node.type == "Property" && node.value.type == "FunctionExpression" )
		{
			//console.log( node.loc.start.line + ":" + node.key.name );
			if( node.key.name )
			{
				markers[node.key.name] = node.key.name;
			}
		}

		if( node.type == "AssignmentExpression" && node.right.type == "FunctionExpression" )
		{
			if( node.left.property && node.left.property.name )
			{
				markers[node.left.property.name] = node.left.property.name;
			}
		}

   });

	var asArray = [];
   for( var m in markers)
	{
		asArray.push( m );		
	}
	return asArray;

   //console.log( JSON.stringify(result, null, 3 ));

   //console.log( result.tokens.map( function(item)
	//	{
	//		return item.type;
	//	}).join()
	//);
};

exports.extractCalls = function(data)
{
	var calls = {};

	traverse(data, function (node) 
	{
		if( node.type == "CallExpression" && node.callee.property && node.callee.property.type == "Identifier" )
		{
			if( node.callee.property.name )
			{
				calls[node.callee.property.name] = node.callee.property.name;
			}
		}
   });

	var asArray = [];
   for( var c in calls)
	{
		asArray.push( c );		
	}
	return asArray;
}



function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}


function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}