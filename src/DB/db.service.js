export const findOne = async ({
  model,
  filter = {},
  select = " ",
  populate = [],
} = {}) => {
  return await model.findOne(filter).select(select).populate(populate);
};

export const findById = async ({
  model,
  id,
  select = " ",
  populate = [],
} = {}) => {
  return await model.findById(id).select(select).populate(populate);
};

export const create = async ({ model, data = [{}], options = {} } = {}) => {
  return await model.create(data, options);
};

export const updateOne = async ({
  model,
  filter = {},
  data = {},
  options = { runValidators: true },
} = {}) => {
  return await model.updateOne(filter, data, options);
}

export const findOneAndUpdate = async ({
  model,
  filter = {},
  data = {},
  options = { runValidators: true, new: true },
  select = null,
  populate = [],
} = {}) => {
  return await model.findOneAndUpdate(filter, data, options).select(select).populate(populate);
}

export const deleteOne = async ({
  model,
  filter = {},
} = {}) => {
  return await model.deleteOne(filter);
}


