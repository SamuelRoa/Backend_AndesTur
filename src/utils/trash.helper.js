import { trashModel } from "../models/trash.models.js";

export async function moveToTrash(model, recordId, deletedBy) {
  const record = await model.findByPk(recordId);
  if (!record) return null;

  const pkField = model.primaryKeyAttribute;
  const tableName = model.tableName || model.getTableName();

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  await trashModel.create({
    table_name: tableName,
    record_id: recordId,
    data: record.toJSON(),
    deleted_by: deletedBy || null,
    deleted_at: now,
    expires_at: expiresAt,
  });

  await model.destroy({ where: { [pkField]: recordId } });
  return record.toJSON();
}
